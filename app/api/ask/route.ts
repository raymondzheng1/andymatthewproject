import { z } from "zod";
import { guideReply } from "@/lib/ai";
import { getObject } from "@/lib/objects";

// Model replies can take several seconds; the hosting default can cut them off.
export const maxDuration = 60;

const Body = z.object({
  objectId: z.string().max(40),
  question: z.string().trim().min(1).max(500),
  history: z.array(z.object({ question: z.string().max(500), reply: z.string().max(2000) })).max(7),
  seen: z.array(z.string().max(60)).max(40),
});

export async function POST(req: Request): Promise<Response> {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const obj = getObject(parsed.data.objectId);
  if (!obj) return Response.json({ error: "Unknown object" }, { status: 404 });
  const reply = await guideReply(obj, parsed.data.question, parsed.data.history, parsed.data.seen);
  return Response.json(reply);
}
