import { MODEL, checkAi } from "@/lib/ai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** GET /api/status shows whether AI answers are switched on; add ?check=1 to make a test call. */
export async function GET(req: Request): Promise<Response> {
  const configured = !!process.env.ANTHROPIC_API_KEY;
  const check = new URL(req.url).searchParams.get("check") === "1" ? await checkAi() : undefined;
  return Response.json({ aiConfigured: configured, model: MODEL, ...(check ? { check } : {}) });
}
