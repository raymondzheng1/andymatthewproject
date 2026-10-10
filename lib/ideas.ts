import { z } from "zod";
import type { ClassAnalysis } from "./insights";

export const LessonPlanSchema = z.object({
  intro: z.string(),
  steps: z.array(
    z.object({
      title: z.string(),
      minutes: z.number(),
      activity: z.string(),
      why: z.string(),
    }),
  ),
});
export type LessonPlan = z.infer<typeof LessonPlanSchema>;

type Template = { match: RegExp; plan: (detail: string) => LessonPlan };

const TEMPLATES: Template[] = [
  {
    match: /time period|date|dating|old|when/i,
    plan: (why) => ({
      intro: "A lesson on working out when an object is from.",
      steps: [
        { title: "Layers warm-up", minutes: 10, activity: "Show a jar of layered sand or a cross-section photo. Ask: which layer is oldest, and how do you know?", why },
        { title: "Question swap", minutes: 10, activity: "Put “How old is it?” on the board. In pairs, students rewrite it into a question the sources can answer, such as “What else was found in that layer?”", why: "" },
        { title: "Source hunt", minutes: 20, activity: "Pairs reopen their sources, find one dating clue and add it to their log with the source linked.", why: "" },
        { title: "Exit ticket", minutes: 5, activity: "“I think it dates from ___ because ___ (source).”", why: "" },
      ],
    }),
  },
  {
    match: /fact|inference|certain/i,
    plan: (why) => ({
      intro: "A short lesson on telling facts from interpretations.",
      steps: [
        { title: "Sort the statements", minutes: 10, activity: "Give groups ten statements about an object. They sort them into fact, historical record, scholarly inference and cultural interpretation.", why },
        { title: "Hedge it", minutes: 10, activity: "Students rewrite three certain-sounding claims from their own logs using words like “probably” or “the evidence suggests”.", why: "" },
        { title: "Share back", minutes: 5, activity: "Two students read a before-and-after sentence aloud and the class says what changed.", why: "" },
      ],
    }),
  },
  {
    match: /own words|copied|copy|flag/i,
    plan: (why) => ({
      intro: "An activity to help students write reasoning in their own words.",
      steps: [
        { title: "Close the chat", minutes: 5, activity: "Students close the conversation and explain the key evidence aloud to a partner from memory.", why },
        { title: "Write it back", minutes: 10, activity: "Without looking at the chat, they rewrite their reasoning, then compare it with what the sources say.", why: "" },
        { title: "Check together", minutes: 5, activity: "Partners underline anything that still sounds copied and suggest a plainer way to say it.", why: "" },
      ],
    }),
  },
];

const GENERAL: LessonPlan = {
  intro: "A general plan to strengthen evidence-based reasoning.",
  steps: [
    { title: "Model a good question", minutes: 10, activity: "Show one guessing question and one investigating question side by side, and discuss why the second gets more evidence.", why: "" },
    { title: "Evidence chain", minutes: 15, activity: "Students pick one claim from their log and write the chain: observation, source, what it shows.", why: "" },
    { title: "Peer check", minutes: 10, activity: "Partners swap logs and mark each claim as linked to a source or not.", why: "" },
  ],
};

/** Plans built from the class data when no language model is available. */
export function offlinePlan(analysis: ClassAnalysis, question: string): LessonPlan {
  for (const t of TEMPLATES) {
    if (t.match.test(question)) {
      const related = analysis.needsWork.find((n) => t.match.test(n.title));
      return t.plan(related ? `Why: ${related.detail}` : "");
    }
  }
  const top = analysis.needsWork[0];
  if (top) {
    const t = TEMPLATES.find((x) => x.match.test(top.title));
    if (t) return t.plan(`Why: ${top.detail}`);
  }
  return GENERAL;
}
