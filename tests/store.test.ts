import { beforeEach, describe, expect, it } from "vitest";
import { analyseClass, checkOriginality, questionsLeft, shouldFlag } from "@/lib/insights";
import { seedDemo } from "@/lib/demo";
import * as store from "@/lib/store";

function memoryKV(): store.KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

beforeEach(() => store.setStorage(memoryKV()));

describe("student accounts", () => {
  it("lets a student sign up without a class and log back in with their code", () => {
    const s = store.signUpStudent("Ava");
    expect(s.loginCode).toMatch(/^[A-Z]+-[A-Z]+-\d{4}$/);
    expect(store.classesForStudent(s.id)).toEqual([]);
    store.setSession(null);
    expect(store.logInStudent(` ${s.loginCode!.toLowerCase()} `).id).toBe(s.id);
    expect(() => store.logInStudent("NOPE-NOPE-0000")).toThrow(store.AccountError);
  });

  it("joins a class from a class code at sign-up", async () => {
    const t = await store.signUpWithPassword("teacher", "T", "t@x.com", "password1");
    const cls = store.createClass(t.id, "9B");
    const s = store.signUpStudent("Ben", cls.code);
    expect(store.classesForStudent(s.id).map((c) => c.id)).toEqual([cls.id]);
  });
});

describe("teacher and parent accounts", () => {
  it("checks passwords and rejects duplicate emails", async () => {
    await store.signUpWithPassword("parent", "P", "P@x.com", "password1");
    await expect(store.signUpWithPassword("parent", "P2", "p@x.com", "password1")).rejects.toThrow(store.AccountError);
    await expect(store.logInWithPassword("p@x.com", "wrong-pass")).rejects.toThrow(store.AccountError);
    expect((await store.logInWithPassword("p@x.com", "password1")).name).toBe("P");
  });

  it("links a parent to a child with the family link and keeps a two-way thread", async () => {
    const kid = store.signUpStudent("Cara");
    const parent = await store.signUpWithPassword("parent", "Dee", "d@x.com", "password1");
    store.linkChild(parent.id, `https://example.com/parent?link=${kid.parentLinkCode}`);
    expect(store.childrenOf(parent.id).map((c) => c.id)).toEqual([kid.id]);
    store.addNote(kid.id, parent.id, "Finish your log by Thursday?", false);
    store.addNote(kid.id, kid.id, "I'm too busy this week, can we make a plan?", false);
    expect(store.notesFor(kid.id).map((n) => n.authorId)).toEqual([parent.id, kid.id]);
  });
});

describe("questions and originality", () => {
  it("counts blocked questions toward the 7", async () => {
    const info = await seedDemo();
    const maya = store.getDb().users.find((u) => u.loginCode === info.students[0]!.code)!;
    const inv = store.findInvestigation(maya.id, "a-014")!;
    const blocked = inv.messages.filter((m) => m.from === "guide" && m.kind === "blocked");
    expect(blocked).toHaveLength(1);
    expect(questionsLeft(inv)).toBe(3);
  });

  it("flags a log that copies the chat and not one written in the student's own words", async () => {
    await seedDemo();
    const db = store.getDb();
    const byName = (n: string) => db.investigations.find((i) => db.users.find((u) => u.id === i.studentId)?.name === n)!;
    expect(byName("Jordan").log.flag).toBeDefined();
    expect(byName("Priya").log.flag).toBeUndefined();
    const own = checkOriginality({ ...store.emptyLog(), reasoning: "I reckon the hammered end shows it was struck many times." }, ["Archaeologists think this area was used for metalworking."]);
    expect(shouldFlag(own)).toBe(false);
  });

  it("produces a class analysis from submitted work", async () => {
    await seedDemo();
    const db = store.getDb();
    const a = analyseClass(db.classes[0]!, db.investigations);
    expect(a.logsSubmitted).toBe(2);
    expect(a.flagged).toBe(1);
    expect(a.needsWork.some((n) => n.title === "Own words")).toBe(true);
  });
});

describe("guest accounts", () => {
  it("can use every practice object but nothing else", () => {
    const g = store.signInAsGuest();
    expect(g).toMatchObject({ role: "student", guest: true });
    expect(g.loginCode).toBeUndefined();
    expect(store.canUseObject(g.id, "p-001")).toBe(true);
    expect(store.canUseObject(g.id, "p-002")).toBe(true);
    expect(store.canUseObject(g.id, "p-003")).toBe(true);
    expect(store.canUseObject(g.id, "a-014")).toBe(false);
    expect(() => store.startInvestigation(g.id, "a-014")).toThrow(store.AccountError);
    expect(store.startInvestigation(g.id, "p-002").objectId).toBe("p-002");
  });

  it("can't join a class, be linked by a parent or use notes", async () => {
    const t = await store.signUpWithPassword("teacher", "T", "t2@x.com", "password1");
    const cls = store.createClass(t.id, "9C");
    const parent = await store.signUpWithPassword("parent", "P", "p2@x.com", "password1");
    const g = store.signInAsGuest();
    expect(() => store.joinClass(g.id, cls.code)).toThrow(store.AccountError);
    expect(store.classesForStudent(g.id)).toEqual([]);
    expect(g.parentLinkCode).toBeUndefined();
    expect(() => store.addNote(g.id, parent.id, "hi", false)).toThrow(store.AccountError);
    expect(() => store.addNote(g.id, g.id, "hi", false)).toThrow(store.AccountError);
  });

  it("deletes the guest and their work on log out, leaving other accounts alone", () => {
    const s = store.signUpStudent("Real");
    store.startInvestigation(s.id, "p-001");
    const g = store.signInAsGuest();
    store.startInvestigation(g.id, "p-001");
    store.addWord(g.id, "patina", "old coating");
    store.logOut();
    const db = store.getDb();
    expect(db.users.some((u) => u.id === g.id)).toBe(false);
    expect(db.investigations.some((i) => i.studentId === g.id)).toBe(false);
    expect(db.words.some((w) => w.studentId === g.id)).toBe(false);
    expect(db.investigations.some((i) => i.studentId === s.id)).toBe(true);
    expect(store.currentUser()).toBeNull();
  });
});
