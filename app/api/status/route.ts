import { MODEL, checkAi } from "@/lib/ai";
import { deploymentInfo, findApiKey } from "@/lib/env";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/status shows whether AI answers are switched on, which deployment
 * answered, and any setting that looks like a misnamed key. Add ?check=1 to
 * make a test call. Never shows the key itself.
 */
export async function GET(req: Request): Promise<Response> {
  const found = findApiKey();
  const hint = found.key
    ? found.from === "ANTHROPIC_API_KEY"
      ? undefined
      : `Using the key from ${found.from}. Renaming it to ANTHROPIC_API_KEY is recommended.`
    : found.empty
      ? "ANTHROPIC_API_KEY exists on this deployment but its value is empty."
      : found.nearMisses.length
        ? `ANTHROPIC_API_KEY isn't set, but these similar settings are: ${found.nearMisses.join(", ")}. Rename the right one to exactly ANTHROPIC_API_KEY and redeploy.`
        : "No ANTHROPIC_API_KEY on this deployment. In Vercel, check it is ticked for Production, then redeploy and open this page on the new deployment's address.";
  const check = new URL(req.url).searchParams.get("check") === "1" ? await checkAi() : undefined;
  return Response.json({
    aiConfigured: !!found.key,
    model: MODEL,
    deployment: deploymentInfo(),
    ...(hint ? { hint } : {}),
    ...(check ? { check } : {}),
  });
}
