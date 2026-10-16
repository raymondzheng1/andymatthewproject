import type { ChatMessage, ClassRoom, Db, Investigation, InterpretationLog, Note, Role, User } from "./schema";
import { Db as DbSchema } from "./schema";
import { getObject } from "./objects";

/**
 * Every piece of app data lives in the browser (localStorage) for now. There
 * is no server database yet, so accounts only exist on the device they were
 * created on. All writes go through this module so a real backend can replace
 * it later without touching the screens.
 */

export type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };

const DB_KEY = "aoi.db.v1";
const SESSION_KEY = "aoi.session.v1";

let kv: KV | null = null;
let cache: Db | null = null;
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version++;
  listeners.forEach((l) => l());
}

/** Changes whenever data or the signed-in user changes (for useSyncExternalStore). */
export function getVersion(): number {
  return version;
}

export function setStorage(store: KV): void {
  kv = store;
  cache = null;
}

function storage(): KV {
  if (kv) return kv;
  if (typeof window !== "undefined") {
    kv = window.localStorage;
    return kv;
  }
  throw new Error("No storage available");
}

export function emptyDb(): Db {
  return { version: 1, users: [], classes: [], investigations: [], notes: [], words: [], parentLinks: [], walkthroughDone: [] };
}

export function getDb(): Db {
  if (cache) return cache;
  const raw = storage().getItem(DB_KEY);
  if (!raw) {
    cache = emptyDb();
    return cache;
  }
  const parsed = DbSchema.safeParse(JSON.parse(raw));
  cache = parsed.success ? parsed.data : emptyDb();
  return cache;
}

function commit(mutate: (db: Db) => void): void {
  const next = structuredClone(getDb());
  mutate(next);
  storage().setItem(DB_KEY, JSON.stringify(next));
  cache = next;
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetAll(): void {
  storage().removeItem(DB_KEY);
  storage().removeItem(SESSION_KEY);
  cache = null;
  notify();
}

/* ------------------------------------------------------------------ ids and codes */

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

const WORDS = ["AMBER", "BRONZE", "CEDAR", "DELTA", "EMBER", "FLINT", "GRANITE", "HEARTH", "IVORY", "JASPER", "KILN", "LAPIS", "MOSAIC", "NILE", "OCHRE", "PAPYRUS", "QUARTZ", "RELIC", "SCROLL", "TABLET", "URN", "VAULT", "WAX", "ZEPHYR"];

function randInt(max: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]! % max;
}

function word(): string {
  return WORDS[randInt(WORDS.length)]!;
}

function digits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += String(randInt(10));
  return s;
}

function uniqueCode(make: () => string, taken: (c: string) => boolean): string {
  for (;;) {
    const c = make();
    if (!taken(c)) return c;
  }
}

export function normaliseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

/* ------------------------------------------------------------------ accounts */

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `${salt}$${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export class AccountError extends Error {}

export async function signUpWithPassword(role: Exclude<Role, "student">, name: string, email: string, password: string): Promise<User> {
  const e = email.trim().toLowerCase();
  if (password.length < 8) throw new AccountError("Use a password of at least 8 characters.");
  if (getDb().users.some((u) => u.email === e)) throw new AccountError("An account with that email already exists. Log in instead.");
  const user: User = { id: uid(), role, name: name.trim(), email: e, passwordHash: await hashPassword(password, uid()), createdAt: now() };
  commit((db) => void db.users.push(user));
  setSession(user.id);
  return user;
}

/** Students need no email or class: they get a login code to sign back in with. */
export function signUpStudent(name: string, classCode?: string): User {
  const db = getDb();
  const loginCode = uniqueCode(() => `${word()}-${word()}-${digits(4)}`, (c) => db.users.some((u) => u.loginCode === c));
  const parentLinkCode = uniqueCode(() => `FAMILY-${digits(6)}`, (c) => db.users.some((u) => u.parentLinkCode === c));
  const user: User = { id: uid(), role: "student", name: name.trim(), loginCode, parentLinkCode, createdAt: now() };
  commit((d) => void d.users.push(user));
  if (classCode && classCode.trim()) joinClass(user.id, classCode);
  setSession(user.id);
  return user;
}

/**
 * A guest student: no name, code or email. Guests can only use practice
 * objects, can't join a class, link a parent or send notes, and everything
 * they did is deleted when they log out.
 */
export function signInAsGuest(): User {
  const user: User = { id: uid(), role: "student", name: "Guest", guest: true, createdAt: now() };
  commit((d) => void d.users.push(user));
  setSession(user.id);
  return user;
}

/** Ends the session. A guest's account and work are deleted. */
export function logOut(): void {
  const user = currentUser();
  if (user?.guest) {
    commit((d) => {
      d.users = d.users.filter((u) => u.id !== user.id);
      d.investigations = d.investigations.filter((i) => i.studentId !== user.id);
      d.words = d.words.filter((w) => w.studentId !== user.id);
      d.walkthroughDone = d.walkthroughDone.filter((id) => id !== user.id);
    });
  }
  setSession(null);
}

export function isGuest(userId: string): boolean {
  return !!getUser(userId)?.guest;
}

export function logInStudent(code: string): User {
  const c = normaliseCode(code);
  const user = getDb().users.find((u) => u.role === "student" && u.loginCode === c);
  if (!user) throw new AccountError("That login code doesn't match an account on this device.");
  setSession(user.id);
  return user;
}

export async function logInWithPassword(email: string, password: string): Promise<User> {
  const e = email.trim().toLowerCase();
  const user = getDb().users.find((u) => u.email === e);
  if (!user?.passwordHash) throw new AccountError("Email or password is incorrect.");
  const salt = user.passwordHash.split("$")[0]!;
  if ((await hashPassword(password, salt)) !== user.passwordHash) throw new AccountError("Email or password is incorrect.");
  setSession(user.id);
  return user;
}

export function setSession(userId: string | null): void {
  if (userId) storage().setItem(SESSION_KEY, userId);
  else storage().removeItem(SESSION_KEY);
  notify();
}

export function currentUser(): User | null {
  const id = storage().getItem(SESSION_KEY);
  return (id && getDb().users.find((u) => u.id === id)) || null;
}

export function getUser(id: string): User | undefined {
  return getDb().users.find((u) => u.id === id);
}

/* ------------------------------------------------------------------ classes */

export function createClass(teacherId: string, name: string): ClassRoom {
  const db = getDb();
  const code = uniqueCode(() => `${word()}-${digits(3)}`, (c) => db.classes.some((k) => k.code === c));
  const cls: ClassRoom = { id: uid(), name: name.trim(), teacherId, code, studentIds: [], assignments: [] };
  commit((d) => void d.classes.push(cls));
  return cls;
}

export function joinClass(studentId: string, code: string): ClassRoom {
  if (isGuest(studentId)) throw new AccountError("Guest accounts can't join a class. Create a student account to join one.");
  const c = normaliseCode(code);
  const cls = getDb().classes.find((k) => k.code === c);
  if (!cls) throw new AccountError("No class uses that code.");
  commit((d) => {
    const k = d.classes.find((x) => x.id === cls.id)!;
    if (!k.studentIds.includes(studentId)) k.studentIds.push(studentId);
  });
  return cls;
}

export function assignObject(classId: string, objectId: string, due?: string): void {
  commit((d) => {
    const k = d.classes.find((x) => x.id === classId);
    if (k && !k.assignments.some((a) => a.objectId === objectId)) k.assignments.push({ objectId, due });
  });
}

export function classesForTeacher(teacherId: string): ClassRoom[] {
  return getDb().classes.filter((k) => k.teacherId === teacherId);
}

export function classesForStudent(studentId: string): ClassRoom[] {
  return getDb().classes.filter((k) => k.studentIds.includes(studentId));
}

/* ------------------------------------------------------------------ investigations */

export function emptyLog(): InterpretationLog {
  return { material: "", location: "", timePeriod: "", reasoning: "", sources: { material: [], location: [], timePeriod: [], reasoning: [] } };
}

export function findInvestigation(studentId: string, objectId: string): Investigation | undefined {
  return getDb().investigations.find((i) => i.studentId === studentId && i.objectId === objectId);
}

/** Guests may only use practice objects. */
export function canUseObject(studentId: string, objectId: string): boolean {
  return !isGuest(studentId) || !!getObject(objectId)?.practice;
}

export function startInvestigation(studentId: string, objectId: string): Investigation {
  if (!canUseObject(studentId, objectId)) throw new AccountError("Guest accounts can only use practice objects.");
  const existing = findInvestigation(studentId, objectId);
  if (existing) return existing;
  const inv: Investigation = { id: uid(), studentId, objectId, startedAt: now(), messages: [], log: emptyLog() };
  commit((d) => void d.investigations.push(inv));
  return inv;
}

export function addMessages(invId: string, msgs: ChatMessage[]): void {
  commit((d) => {
    const inv = d.investigations.find((i) => i.id === invId);
    if (inv) inv.messages.push(...msgs);
  });
}

export function saveLog(invId: string, log: InterpretationLog): void {
  commit((d) => {
    const inv = d.investigations.find((i) => i.id === invId);
    if (inv) inv.log = log;
  });
}

export function investigationsFor(studentId: string): Investigation[] {
  return getDb().investigations.filter((i) => i.studentId === studentId);
}

export function getInvestigation(id: string): Investigation | undefined {
  return getDb().investigations.find((i) => i.id === id);
}

/* ------------------------------------------------------------------ parents, notes, words */

export function linkChild(parentId: string, linkCodeOrUrl: string): User {
  const m = linkCodeOrUrl.match(/FAMILY-\d{6}/i);
  const code = m ? m[0].toUpperCase() : normaliseCode(linkCodeOrUrl);
  const child = getDb().users.find((u) => u.role === "student" && u.parentLinkCode === code);
  if (!child || child.guest) throw new AccountError("That family link doesn't match a student on this device.");
  commit((d) => {
    if (!d.parentLinks.some((l) => l.parentId === parentId && l.studentId === child.id)) d.parentLinks.push({ parentId, studentId: child.id });
  });
  return child;
}

export function childrenOf(parentId: string): User[] {
  const db = getDb();
  return db.parentLinks.filter((l) => l.parentId === parentId).map((l) => db.users.find((u) => u.id === l.studentId)).filter((u): u is User => !!u);
}

export function parentsOf(studentId: string): User[] {
  const db = getDb();
  return db.parentLinks.filter((l) => l.studentId === studentId).map((l) => db.users.find((u) => u.id === l.parentId)).filter((u): u is User => !!u);
}

export function addNote(studentId: string, authorId: string, text: string, shareWithTeacher: boolean): Note {
  if (isGuest(studentId)) throw new AccountError("Guest accounts can't send or receive notes.");
  const note: Note = { id: uid(), studentId, authorId, text: text.trim(), at: now(), shareWithTeacher };
  commit((d) => void d.notes.push(note));
  return note;
}

export function notesFor(studentId: string): Note[] {
  return getDb().notes.filter((n) => n.studentId === studentId).sort((a, b) => a.at.localeCompare(b.at));
}

export function addWord(studentId: string, term: string, paraphrase: string): void {
  commit((d) => {
    const existing = d.words.find((w) => w.studentId === studentId && w.term === term);
    if (existing) existing.paraphrase = paraphrase;
    else d.words.push({ studentId, term, paraphrase });
  });
}

export function wordsFor(studentId: string) {
  return getDb().words.filter((w) => w.studentId === studentId);
}

export function markWalkthroughDone(studentId: string): void {
  commit((d) => {
    if (!d.walkthroughDone.includes(studentId)) d.walkthroughDone.push(studentId);
  });
}

/** For seeding demo data. */
export function _commit(mutate: (db: Db) => void): void {
  commit(mutate);
}
