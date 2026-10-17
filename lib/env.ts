import "server-only";

export type KeyLookup = {
  key: string | null;
  /** Name of the variable the key came from. */
  from: string | null;
  /** Variables that look like they were meant to be the key (names only, never values). */
  nearMisses: string[];
  /** Set but blank. */
  empty: boolean;
};

const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

/**
 * Finds the Anthropic API key. Prefers ANTHROPIC_API_KEY, but also accepts a
 * variable with a slightly different name (CLAUDE_API_KEY, "ANTHROPIC_API_KEY "
 * with a stray space, lower case…) when its value looks like an Anthropic key.
 */
export function findApiKey(env: Record<string, string | undefined> = process.env): KeyLookup {
  const exact = clean(env.ANTHROPIC_API_KEY);
  const lookalikes = Object.keys(env).filter((name) => name !== "ANTHROPIC_API_KEY" && /anthropic|claude/i.test(name) && /key/i.test(name));
  if (exact) return { key: exact, from: "ANTHROPIC_API_KEY", nearMisses: lookalikes, empty: false };
  for (const name of lookalikes) {
    const v = clean(env[name]);
    if (v.startsWith("sk-ant-")) return { key: v, from: name.trim(), nearMisses: lookalikes, empty: false };
  }
  return { key: null, from: null, nearMisses: lookalikes, empty: "ANTHROPIC_API_KEY" in env };
}

/** Which deployment is answering, so it's clear whether a redeploy reached it. */
export function deploymentInfo(env: Record<string, string | undefined> = process.env) {
  return {
    environment: env.VERCEL_ENV ?? "local",
    commit: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    url: env.VERCEL_URL ?? null,
  };
}
