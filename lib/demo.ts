import { offlineAnswer } from "./guide";
import { checkOriginality, shouldFlag } from "./insights";
import { getObject } from "./objects";
import type { ChatMessage, InterpretationLog } from "./schema";
import {
  addMessages, addNote, assignObject, createClass, emptyLog, getDb, linkChild, saveLog, setSession,
  signUpStudent, signUpWithPassword, startInvestigation,
} from "./store";

export const DEMO_TEACHER = { email: "teacher@demo.local", password: "demo1234" };
export const DEMO_PARENT = { email: "parent@demo.local", password: "demo1234" };

export type DemoInfo = { classCode: string; students: { name: string; code: string }[] };

function converse(studentId: string, objectId: string, questions: string[]) {
  const obj = getObject(objectId)!;
  const inv = startInvestigation(studentId, objectId);
  const msgs: ChatMessage[] = [];
  const seen: string[] = [];
  for (const q of questions) {
    const at = new Date().toISOString();
    const reply = offlineAnswer(q, obj, seen, at);
    if (reply.sourceId) seen.push(reply.sourceId);
    msgs.push({ from: "student", text: q, at }, reply);
  }
  addMessages(inv.id, msgs);
  return { inv, guideTexts: msgs.flatMap((m) => (m.from === "guide" ? [m.text] : [])) };
}

function submit(invId: string, guideTexts: string[], log: Omit<InterpretationLog, "submittedAt" | "flag" | "review">) {
  const o = checkOriginality({ ...emptyLog(), ...log }, guideTexts);
  saveLog(invId, { ...log, submittedAt: new Date().toISOString(), flag: shouldFlag(o) ? { score: o.score, matches: o.matches } : undefined });
}

/** Creates a sample class so every account type can be tried. Safe to call twice. */
export async function seedDemo(): Promise<DemoInfo> {
  const existing = getDb().users.find((u) => u.email === DEMO_TEACHER.email);
  if (existing) return describe(existing.id);

  const teacher = await signUpWithPassword("teacher", "Ms. Chen", DEMO_TEACHER.email, DEMO_TEACHER.password);
  const cls = createClass(teacher.id, "Class 9B · History");
  assignObject(cls.id, "a-014");

  const maya = signUpStudent("Maya", cls.code);
  const m = converse(maya.id, "a-014", ["What is it made of?", "Where was it found?", "What were the hearths used for?", "So is it a tool or a weapon?"]);
  saveLog(m.inv.id, {
    ...emptyLog(),
    material: "Copper with some tin, so bronze. The green coating is corrosion that builds up on old metal.",
    location: "Trench 4, layer 3, next to two small hearths with charcoal wood shavings.",
    sources: { material: ["a14-conservation"], location: ["a14-excavation"], timePeriod: [], reasoning: [] },
  });

  const jordan = signUpStudent("Jordan", cls.code);
  const j = converse(jordan.id, "a-014", ["What were the hearths used for?", "What is it made of?", "When is layer 3 from?", "Is it a weapon?", "Where was it found?", "What marks are on it?", "Is it special to people?"]);
  submit(j.inv.id, j.guideTexts, {
    material: "It is copper with tin.",
    location: "Trench 4 layer 3.",
    timePeriod: "About 3,000 years ago from the charcoal.",
    reasoning: "Archaeologists think this part of the site was used for small-scale metalworking and woodworking, based on slag and wood shavings found around the hearths. This is an interpretation from indirect evidence, not a certainty.",
    sources: { material: ["a14-conservation"], location: [], timePeriod: ["a14-excavation"], reasoning: [] },
  });

  const priya = signUpStudent("Priya", cls.code);
  const p = converse(priya.id, "a-014", ["What does the narrow end look like?", "Where was it found and what was near it?", "How old is layer 3?", "What happened in that area?", "What is it made of?"]);
  submit(p.inv.id, p.guideTexts, {
    material: "A copper alloy. The conservation report says the green crust is corrosion.",
    location: "Found beside two hearths in trench 4 with wood shavings turned to charcoal.",
    timePeriod: "Layer 3 charcoal was radiocarbon dated to roughly 3,000 years ago, so probably that old.",
    reasoning: "The thin end is worn smooth with scratches and the wide end looks hammered. Together with the wood shavings, I think it might have been hit to shape wood, but I'm not certain.",
    sources: { material: ["a14-conservation"], location: ["a14-excavation"], timePeriod: ["a14-excavation"], reasoning: ["a14-conservation", "a14-summary"] },
  });

  const parent = await signUpWithPassword("parent", "Sam R.", DEMO_PARENT.email, DEMO_PARENT.password);
  linkChild(parent.id, maya.parentLinkCode!);
  addNote(maya.id, parent.id, "Loved hearing you explain corrosion at dinner! Can you finish your log by Thursday?", false);
  addNote(maya.id, maya.id, "I have netball on Wednesday and Thursday, so I'm too busy. Can we make a plan for the weekend?", false);

  setSession(null);
  return describe(teacher.id);
}

function describe(teacherId: string): DemoInfo {
  const db = getDb();
  const cls = db.classes.find((c) => c.teacherId === teacherId)!;
  return {
    classCode: cls.code,
    students: cls.studentIds.map((id) => db.users.find((u) => u.id === id)!).map((u) => ({ name: u.name, code: u.loginCode! })),
  };
}
