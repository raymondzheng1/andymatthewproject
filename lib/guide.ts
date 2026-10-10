import type { ObjectCase, Passage } from "./objects";
import { findPassage } from "./objects";
import type { GuideMessage } from "./schema";

/**
 * Questions that ask the guide to name the object or its function, directly
 * or in disguise ("so is it a tool or a weapon?"). These are refused, and they
 * still count as one of the student's seven questions.
 */
const IDENTITY_PATTERNS: RegExp[] = [
  // "What is it?" on its own, but not "What is it made of?"
  /\bwhat\s+(is|was|'s)\s+(it|this|that|the object)\s*[?.!]*\s*$/i,
  /\bwhat\s+(kind|type|sort)\s+of\s+(object|thing|item|tool)\b/i,
  /\bwhat\s+(is|was)\s+(it|this)\s+(called|for)\b/i,
  /\bwhat\s+did\s+(they|people|someone)\s+use\s+(it|this)\s+for\b/i,
  /\bwhat\s+was\s+(it|this)\s+used\s+for\b/i,
  /\bwhat\s+does\s+(it|this)\s+do\b/i,
  /\b(is|was)\s+(it|this|that)\s+(a|an)\s+\w+/i,
  /\b(is|was)\s+(it|this)\s+used\s+(for|as|to)\b/i,
  /\b(tell|give)\s+me\s+(what|the answer)\b/i,
  /\bidentify\s+(it|this|the object)\b/i,
  /\bwhat\s+(object|thing)\s+is\b/i,
  /\bname\s+of\s+(the|this)\s+object\b/i,
];

export function isIdentityQuestion(question: string): boolean {
  const q = question.trim();
  return IDENTITY_PATTERNS.some((re) => re.test(q));
}

/** True when a piece of text would give the object's identity away. */
export function revealsIdentity(text: string, obj: ObjectCase): boolean {
  const t = text.toLowerCase();
  return obj.identityTerms.some((term) => new RegExp(`\\b${escapeRegExp(term.toLowerCase())}s?\\b`).test(t));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STOP = new Set(["the", "a", "an", "is", "it", "this", "that", "of", "to", "in", "on", "and", "or", "what", "did", "does", "do", "was", "were", "be", "are", "can", "you", "me", "i", "about", "there", "any"]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function stem(w: string): string {
  return w.replace(/(ing|ed|es|s)$/, "");
}

/** Score how well a passage matches a question, by keyword overlap. */
export function scorePassage(question: string, passage: Passage): number {
  const q = tokens(question).map(stem);
  const keys = new Set(passage.keywords.map((k) => stem(k.toLowerCase())));
  const body = new Set(tokens(passage.text).map(stem));
  let score = 0;
  for (const w of q) {
    if (keys.has(w)) score += 3;
    else if (body.has(w)) score += 1;
  }
  return score;
}

export function blockedReply(obj: ObjectCase, now: string): GuideMessage {
  const hint = pickHintPassage(obj);
  return {
    from: "guide",
    at: now,
    kind: "blocked",
    text: `That question asks me what the object is, so that part is yours to work out. Instead, look at ${hint.source.title}: what does it tell you that could help you decide for yourself?`,
    sourceId: hint.passage.id,
    contribution: hint.passage.contribution,
    dictionary: [],
  };
}

function pickHintPassage(obj: ObjectCase) {
  // Prefer a passage about wear or use: the most useful clue for reasoning.
  for (const source of obj.sources) {
    for (const passage of source.passages) {
      if (passage.keywords.includes("wear") || passage.keywords.includes("marks")) return { source, passage };
    }
  }
  const source = obj.sources[0]!;
  return { source, passage: source.passages[0]! };
}

export function redirectReply(now: string): GuideMessage {
  return {
    from: "guide",
    at: now,
    kind: "redirect",
    text: "None of the sources for this object answer that. Try asking about something you can check: what it is made of, its size or wear, where it was found and what was near it, or how old the layer or room is.",
    dictionary: [],
  };
}

/**
 * Answer a question using only the object's sources, without a language model.
 * Used when no API key is configured and as the fallback if a model call fails.
 */
export function offlineAnswer(question: string, obj: ObjectCase, alreadyUsed: string[], now: string): GuideMessage {
  if (isIdentityQuestion(question)) return blockedReply(obj, now);

  let best: { passage: Passage; score: number } | undefined;
  for (const source of obj.sources) {
    for (const passage of source.passages) {
      // Slightly prefer passages the student has not seen yet.
      const score = scorePassage(question, passage) - (alreadyUsed.includes(passage.id) ? 0.5 : 0);
      if (score > 0 && (!best || score > best.score)) best = { passage, score };
    }
  }
  if (!best) return redirectReply(now);

  const { passage } = best;
  return {
    from: "guide",
    at: now,
    kind: "answer",
    label: passage.label,
    text: passage.text,
    sourceId: passage.id,
    contribution: passage.contribution,
    dictionary: passage.dictionary,
  };
}

/**
 * Final safety net on any reply before it is shown: it must cite a real
 * passage of this object, and it must not name the object.
 */
export function checkReply(reply: GuideMessage, obj: ObjectCase, now: string): GuideMessage {
  if (revealsIdentity(reply.text, obj) || reply.dictionary.some((d) => revealsIdentity(`${d.term} ${d.definition}`, obj))) {
    return blockedReply(obj, now);
  }
  if (reply.kind === "answer" && (!reply.sourceId || !findPassage(obj, reply.sourceId))) {
    return redirectReply(now);
  }
  return reply;
}
