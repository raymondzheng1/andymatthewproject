import type { ClassRoom, Investigation, InterpretationLog, LogSection, ReasoningFeedback } from "./schema";
import { LOG_SECTIONS, MAX_QUESTIONS, SECTION_TEXT } from "./schema";

/* ------------------------------------------------------------------ originality */

const SHINGLE = 6;

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function shingles(ws: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + SHINGLE <= ws.length; i++) out.add(ws.slice(i, i + SHINGLE).join(" "));
  return out;
}

export type Originality = { score: number; matches: string[] };

/**
 * How much of the student's written log repeats the guide's replies word for
 * word. Score is the share of the log's 6-word runs that also appear in the
 * chat. Matches are the copied stretches, for highlighting.
 */
export function checkOriginality(log: InterpretationLog, guideTexts: string[]): Originality {
  const logWords = words(LOG_SECTIONS.map((s) => log[s]).join(" "));
  const logShingles = [...shingles(logWords)];
  if (logShingles.length === 0) return { score: 0, matches: [] };
  const chat = shingles(words(guideTexts.join(" ")));
  const hit = logShingles.map((s) => chat.has(s));
  const score = hit.filter(Boolean).length / logShingles.length;

  // Merge overlapping copied runs back into readable phrases.
  const matches: string[] = [];
  let start = -1;
  for (let i = 0; i <= hit.length; i++) {
    if (i < hit.length && hit[i]) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      matches.push(logWords.slice(start, i - 1 + SHINGLE).join(" "));
      start = -1;
    }
  }
  return { score, matches };
}

export const FLAG_THRESHOLD = 0.3;

export function shouldFlag(o: Originality): boolean {
  return o.score >= FLAG_THRESHOLD;
}

/* ------------------------------------------------------------------ log feedback */

export type FeedbackItem = { tone: "improve" | "better" | "same"; text: string };

const HEDGES = /\b(might|maybe|probably|perhaps|possibly|i think|could|likely|suggests?)\b/i;
const CERTAIN = /\b(definitely|certainly|must have|was used for|it is a|it was a)\b/i;

function isBlank(s: string): boolean {
  return s.trim().length < 12 || /^\s*(not sure|don'?t know|idk|\?)/i.test(s);
}

export function sectionStrength(log: InterpretationLog, s: LogSection): "strong" | "developing" | "missing" {
  if (isBlank(log[s])) return "missing";
  return log.sources[s].length > 0 ? "strong" : "developing";
}

export function logFeedback(log: InterpretationLog, past: InterpretationLog[], questionsLeft: number): FeedbackItem[] {
  const out: FeedbackItem[] = [];
  for (const s of LOG_SECTIONS) {
    if (isBlank(log[s])) {
      out.push({
        tone: "improve",
        text:
          questionsLeft > 0
            ? `${SECTION_TEXT[s]} is empty. You have ${questionsLeft} question${questionsLeft === 1 ? "" : "s"} left to find evidence for it.`
            : `${SECTION_TEXT[s]} is empty. Look back through the sources you were pointed to.`,
      });
    } else if (log.sources[s].length === 0) {
      out.push({ tone: "improve", text: `Link a source to your ${SECTION_TEXT[s].toLowerCase()} so a reader can check it.` });
    }
  }
  if (!isBlank(log.reasoning) && CERTAIN.test(log.reasoning) && !HEDGES.test(log.reasoning)) {
    out.push({ tone: "improve", text: "Your reasoning sounds certain. Say which evidence supports it and how sure you are." });
  }

  const last = past[past.length - 1];
  if (last) {
    for (const s of LOG_SECTIONS) {
      const before = sectionStrength(last, s);
      const now = sectionStrength(log, s);
      const rank = { missing: 0, developing: 1, strong: 2 } as const;
      if (rank[now] > rank[before]) out.push({ tone: "better", text: `${SECTION_TEXT[s]} is stronger than in your last log.` });
      else if (now === "missing" && before === "missing") out.push({ tone: "same", text: `${SECTION_TEXT[s]} was also missing in your last log.` });
    }
  }
  return out;
}

/** The fixed-rule checklist in the same shape as AI feedback, used when AI isn't available. */
export function ruleFeedback(log: InterpretationLog, past: InterpretationLog[], questionsLeft: number, aiError?: string): ReasoningFeedback {
  const items = logFeedback(log, past, questionsLeft);
  return {
    improve: items.filter((f) => f.tone === "improve").map((f) => f.text),
    compare: items.filter((f) => f.tone !== "improve").map((f) => ({ tone: f.tone === "better" ? "better" : "same", text: f.text })),
    via: "rules",
    aiError,
    at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ class analysis */

export type ClassInsight = { title: string; detail: string };
export type ClassAnalysis = {
  logsSubmitted: number;
  conversations: number;
  flagged: number;
  avgQuestions: number;
  doingWell: ClassInsight[];
  needsWork: ClassInsight[];
};

export function questionsUsed(inv: Investigation): number {
  return inv.messages.filter((m) => m.from === "student").length;
}

export function analyseClass(cls: ClassRoom, investigations: Investigation[]): ClassAnalysis {
  const objectIds = new Set(cls.assignments.map((a) => a.objectId));
  const invs = investigations.filter((i) => cls.studentIds.includes(i.studentId) && objectIds.has(i.objectId));
  const submitted = invs.filter((i) => i.log.submittedAt);
  const n = submitted.length;
  const avgQuestions = invs.length ? invs.reduce((a, i) => a + questionsUsed(i), 0) / invs.length : 0;

  const doingWell: ClassInsight[] = [];
  const needsWork: ClassInsight[] = [];
  if (n > 0) {
    for (const s of LOG_SECTIONS) {
      const strong = submitted.filter((i) => sectionStrength(i.log, s) === "strong").length;
      const missing = submitted.filter((i) => sectionStrength(i.log, s) === "missing").length;
      if (strong / n >= 0.6) doingWell.push({ title: `${SECTION_TEXT[s]} is well supported`, detail: `${strong} of ${n} logs back it up with a linked source.` });
      if (missing / n >= 0.4) needsWork.push({ title: SECTION_TEXT[s], detail: `Blank or unsupported in ${missing} of ${n} logs.` });
    }
    const certain = submitted.filter((i) => CERTAIN.test(i.log.reasoning) && !HEDGES.test(i.log.reasoning)).length;
    if (certain / n >= 0.3) needsWork.push({ title: "Fact vs inference", detail: `${certain} of ${n} logs state interpretations as certain facts.` });
    const flagged = submitted.filter((i) => i.log.flag).length;
    if (flagged > 0) needsWork.push({ title: "Own words", detail: `${flagged} log${flagged === 1 ? "" : "s"} closely copied the chat.` });
  }
  const blocked = invs.reduce((a, i) => a + i.messages.filter((m) => m.from === "guide" && m.kind === "blocked").length, 0);
  if (invs.length > 0 && blocked / invs.length < 0.5) doingWell.push({ title: "Focused questions", detail: "Few questions tried to get the answer directly." });
  if (invs.length > 0 && blocked / invs.length >= 1) needsWork.push({ title: "Guessing", detail: `${blocked} questions asked for the answer directly instead of the evidence.` });

  return {
    logsSubmitted: n,
    conversations: invs.length,
    flagged: submitted.filter((i) => i.log.flag).length,
    avgQuestions: Math.round(avgQuestions * 10) / 10,
    doingWell,
    needsWork,
  };
}

export function questionsLeft(inv: Investigation): number {
  return Math.max(0, MAX_QUESTIONS - questionsUsed(inv));
}
