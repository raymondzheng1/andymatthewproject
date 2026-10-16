import { z } from "zod";
import { reasoningFeedback } from "@/lib/ai";
import { getObject } from "@/lib/objects";

// Model replies can take several seconds; the hosting default can cut them off.
export const maxDuration = 60;

const Text = z.string().max(4000);
const Sources = z.array(z.string().max(60)).max(20);
const LogBody = z.object({
  material: Text,
  location: Text,
  timePeriod: Text,
  reasoning: Text,
  sources: z.object({ material: Sources, location: Sources, timePeriod: Sources, reasoning: Sources }),
});
const Body = z.object({
  objectId: z.string().max(40),
  log: LogBody,
  past: z.array(z.object({ objectCode: z.string().max(40), log: LogBody })).max(5),
  questionsLeft: z.number().int().min(0).max(7),
});

export async function POST(req: Request): Promise<Response> {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const obj = getObject(parsed.data.objectId);
  if (!obj) return Response.json({ error: "Unknown object" }, { status: 404 });
  const { log, past, questionsLeft } = parsed.data;
  return Response.json(await reasoningFeedback(obj, log, past, questionsLeft));
}
