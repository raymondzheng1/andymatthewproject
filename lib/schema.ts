import { z } from "zod";

/** How a claim is known. Every answer the guide gives carries exactly one. */
export const EvidenceLabel = z.enum(["fact", "record", "inference", "cultural"]);
export type EvidenceLabel = z.infer<typeof EvidenceLabel>;

export const LABEL_TEXT: Record<EvidenceLabel, string> = {
  fact: "Fact",
  record: "Historical record",
  inference: "Scholarly inference",
  cultural: "Cultural interpretation",
};

export const DictionaryEntry = z.object({
  term: z.string().min(1),
  pos: z.string().min(1),
  definition: z.string().min(1),
});
export type DictionaryEntry = z.infer<typeof DictionaryEntry>;

export const Role = z.enum(["teacher", "student", "parent"]);
export type Role = z.infer<typeof Role>;

export const User = z.object({
  id: z.string(),
  role: Role,
  name: z.string().min(1),
  createdAt: z.string(),
  /** Teachers and parents sign in with email + password. */
  email: z.string().optional(),
  passwordHash: z.string().optional(),
  /** Students sign in with a code they are given at sign-up. */
  loginCode: z.string().optional(),
  /** Students share this with a parent so the parent can link to them. */
  parentLinkCode: z.string().optional(),
  /** A guest student: practice objects only, no classes, family links or notes. Deleted on log out. */
  guest: z.boolean().optional(),
});
export type User = z.infer<typeof User>;

export const ClassRoom = z.object({
  id: z.string(),
  name: z.string().min(1),
  teacherId: z.string(),
  code: z.string(),
  studentIds: z.array(z.string()),
  /** Object ids assigned to the class, with an optional due date. */
  assignments: z.array(z.object({ objectId: z.string(), due: z.string().optional() })),
});
export type ClassRoom = z.infer<typeof ClassRoom>;

export const ChatMessage = z.discriminatedUnion("from", [
  z.object({ from: z.literal("student"), text: z.string(), at: z.string() }),
  z.object({
    from: z.literal("guide"),
    at: z.string(),
    kind: z.enum(["answer", "blocked", "redirect"]),
    text: z.string(),
    label: EvidenceLabel.optional(),
    sourceId: z.string().optional(),
    contribution: z.string().optional(),
    dictionary: z.array(DictionaryEntry),
    /** "ai": written by the language model. "sources": quoted straight from the passage (fallback). */
    via: z.enum(["ai", "sources"]).optional(),
    /** Why the AI wasn't used, when via is "sources". */
    aiError: z.string().optional(),
  }),
]);
export type ChatMessage = z.infer<typeof ChatMessage>;
export type GuideMessage = Extract<ChatMessage, { from: "guide" }>;

export const LOG_SECTIONS = ["material", "location", "timePeriod", "reasoning"] as const;
export type LogSection = (typeof LOG_SECTIONS)[number];
export const SECTION_TEXT: Record<LogSection, string> = {
  material: "Material",
  location: "Location",
  timePeriod: "Time period",
  reasoning: "Reasoning",
};

/** Feedback on a student's Interpretation Log, written by AI or (as a fallback) by fixed rules. */
export const ReasoningFeedback = z.object({
  improve: z.array(z.string()),
  compare: z.array(z.object({ tone: z.enum(["better", "same", "worse"]), text: z.string() })),
  via: z.enum(["ai", "rules"]),
  aiError: z.string().optional(),
  at: z.string(),
});
export type ReasoningFeedback = z.infer<typeof ReasoningFeedback>;

export const InterpretationLog = z.object({
  material: z.string(),
  location: z.string(),
  timePeriod: z.string(),
  reasoning: z.string(),
  sources: z.object({
    material: z.array(z.string()),
    location: z.array(z.string()),
    timePeriod: z.array(z.string()),
    reasoning: z.array(z.string()),
  }),
  submittedAt: z.string().optional(),
  feedback: ReasoningFeedback.optional(),
  flag: z
    .object({ score: z.number(), matches: z.array(z.string()) })
    .optional(),
  review: z
    .object({
      decision: z.enum(["rewrite", "accept", "discuss"]),
      feedback: z.string(),
      at: z.string(),
    })
    .optional(),
});
export type InterpretationLog = z.infer<typeof InterpretationLog>;

export const Investigation = z.object({
  id: z.string(),
  studentId: z.string(),
  objectId: z.string(),
  startedAt: z.string(),
  messages: z.array(ChatMessage),
  log: InterpretationLog,
});
export type Investigation = z.infer<typeof Investigation>;

/** Notes between a parent and their child are a two-way thread. */
export const Note = z.object({
  id: z.string(),
  studentId: z.string(),
  authorId: z.string(),
  text: z.string().min(1),
  at: z.string(),
  /** Parent notes can also be shared with the child's teachers. */
  shareWithTeacher: z.boolean(),
});
export type Note = z.infer<typeof Note>;

export const WordEntry = z.object({
  studentId: z.string(),
  term: z.string(),
  paraphrase: z.string(),
});
export type WordEntry = z.infer<typeof WordEntry>;

export const Db = z.object({
  version: z.literal(1),
  users: z.array(User),
  classes: z.array(ClassRoom),
  investigations: z.array(Investigation),
  notes: z.array(Note),
  words: z.array(WordEntry),
  /** parentId -> studentIds */
  parentLinks: z.array(z.object({ parentId: z.string(), studentId: z.string() })),
  /** Students who have finished the walkthrough. */
  walkthroughDone: z.array(z.string()),
});
export type Db = z.infer<typeof Db>;

export const MAX_QUESTIONS = 7;
