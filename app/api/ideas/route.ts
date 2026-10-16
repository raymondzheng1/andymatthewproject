import { z } from "zod";
import { teachingPlan } from "@/lib/ai";

// Model replies can take several seconds; the hosting default can cut them off.
export const maxDuration = 60;

const Insight = z.object({ title: z.string().max(120), detail: z.string().max(300) });
const Body = z.object({
  className: z.string().max(80),
  question: z.string().trim().min(1).max(600),
  analysis: z.object({
    logsSubmitted: z.number(),
    conversations: z.number(),
    flagged: z.number(),
    avgQuestions: z.number(),
    doingWell: z.array(Insight).max(10),
    needsWork: z.array(Insight).max(10),
  }),
});

export async function POST(req: Request): Promise<Response> {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { className, analysis, question } = parsed.data;
  return Response.json(await teachingPlan(className, analysis, question));
}
