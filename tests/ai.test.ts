import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { checkAi, guideReply, MODEL, NO_KEY, reasoningFeedback, teachingPlan } from "@/lib/ai";
import { emptyLog } from "@/lib/store";
import { getObject } from "@/lib/objects";
import type { ClassAnalysis } from "@/lib/insights";

const obj = getObject("a-014")!;

type Sent = { url: string; headers: Headers; body: Record<string, unknown> };

/** A client whose HTTP calls go to a fake server returning `reply` as the model's JSON output. */
function fakeClient(reply: unknown, status = 200): { client: Anthropic; sent: Sent[] } {
  const sent: Sent[] = [];
  const fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    sent.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    if (status !== 200) {
      return new Response(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }), {
        status,
        headers: { "content-type": "application/json" },
      });
    }
    return Response.json({
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: MODEL,
      content: [{ type: "text", text: JSON.stringify(reply) }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  };
  return { client: new Anthropic({ apiKey: "test-key", fetch, maxRetries: 0 }), sent };
}

describe("guide uses the AI", () => {
  it("sends the object's sources to the model and returns its wording, labeled from the passage", async () => {
    const { client, sent } = fakeClient({
      kind: "answer",
      passageId: "a14-cons-material",
      text: "Tests show it is mostly copper mixed with a little tin.",
      dictionary: [{ term: "alloy", pos: "noun", definition: "a mix of metals." }],
    });
    const reply = await guideReply(obj, "What is it made of?", [], [], client);
    expect(reply).toMatchObject({ kind: "answer", via: "ai", label: "fact", sourceId: "a14-cons-material", text: "Tests show it is mostly copper mixed with a little tin." });

    const req = sent[0]!;
    expect(req.body.model).toBe(MODEL);
    expect(req.body.fallbacks).toBe("default");
    expect(req.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(String(req.body.system)).toContain('id="a14-exc-find"');
    expect(req.body.output_config).toMatchObject({ effort: "low", format: { type: "json_schema" } });
  });

  it("has the AI write the reply to an identity question, but always as blocked", async () => {
    const { client, sent } = fakeClient({ kind: "answer", passageId: "a14-cons-wear", text: "That's yours to work out! Look at figure 3: what could make that kind of wear?", dictionary: [] });
    const reply = await guideReply(obj, "So is it a tool or a weapon?", [], [], client);
    expect(reply).toMatchObject({ kind: "blocked", via: "ai", sourceId: "a14-cons-wear" });
    expect(reply.text).toContain("figure 3");
    expect(JSON.stringify(sent[0]!.body.messages)).toContain('Reply with kind \\"blocked\\"');
  });

  it("replaces AI wording that would give the answer away", async () => {
    const { client } = fakeClient({ kind: "blocked", passageId: null, text: "I can't say it's a chisel, sorry.", dictionary: [] });
    const reply = await guideReply(obj, "Is it a chisel?", [], [], client);
    expect(reply.kind).toBe("blocked");
    expect(reply.text).not.toMatch(/chisel/i);
  });

  it("falls back to the sources and says why when the key is rejected", async () => {
    const { client } = fakeClient({}, 401);
    const reply = await guideReply(obj, "Where was it found?", [], [], client);
    expect(reply).toMatchObject({ via: "sources", sourceId: "a14-exc-find" });
    expect(reply.aiError).toMatch(/401/);
  });

  it("says plainly when no API key is set", async () => {
    const reply = await guideReply(obj, "Where was it found?", [], [], null);
    expect(reply).toMatchObject({ via: "sources", aiError: NO_KEY });
    expect(await checkAi(null)).toEqual({ ok: false, detail: NO_KEY });
  });
});

describe("teaching ideas use the AI", () => {
  const analysis: ClassAnalysis = { logsSubmitted: 2, conversations: 3, flagged: 1, avgQuestions: 5, doingWell: [], needsWork: [{ title: "Time period", detail: "Blank in 2 of 2 logs." }] };

  it("returns the model's plan", async () => {
    const plan = { intro: "Here's a plan.", steps: [{ title: "Layers", minutes: 10, activity: "Look at layers.", why: "Blank in 2 of 2 logs." }] };
    const { client, sent } = fakeClient(plan);
    expect(await teachingPlan("9B", analysis, "Help with dating?", client)).toEqual({ ...plan, via: "ai" });
    expect(JSON.stringify(sent[0]!.body.messages)).toContain("Blank in 2 of 2 logs.");
  });

  it("falls back to a template and says why on failure", async () => {
    const { client } = fakeClient({}, 401);
    const plan = await teachingPlan("9B", analysis, "Help with dating?", client);
    expect(plan.via).toBe("sources");
    expect(plan.steps.length).toBeGreaterThan(0);
  });
});

describe("reasoning feedback uses the AI", () => {
  const log = {
    ...emptyLog(),
    material: "Copper with some tin, from the conservation report.",
    reasoning: "It was hit at the wide end, so I think it was used on something hard.",
    sources: { material: ["a14-conservation"], location: [], timePeriod: [], reasoning: [] },
  };

  it("sends the log, linked sources and earlier logs, and returns the AI's feedback", async () => {
    const { client, sent } = fakeClient({
      improve: ["Link the excavation record to your reasoning.", "Say how sure you are."],
      compare: [{ tone: "better", text: "You linked a source for material this time." }],
    });
    const fb = await reasoningFeedback(obj, log, [{ objectCode: "Practice P-001", log: { ...emptyLog(), material: "Clay." } }], 3, client);
    expect(fb).toMatchObject({ via: "ai", improve: ["Link the excavation record to your reasoning.", "Say how sure you are."] });
    expect(fb.compare[0]).toMatchObject({ tone: "better" });
    const user = JSON.stringify(sent[0]!.body.messages);
    expect(user).toContain("Conservation report");
    expect(user).toContain("Practice P-001");
    expect(user).toContain("<questions_left>3</questions_left>");
  });

  it("drops feedback that would give the object away", async () => {
    const { client } = fakeClient({ improve: ["Good, it really is a chisel!", "Add a date from the excavation record."], compare: [] });
    const fb = await reasoningFeedback(obj, log, [], 3, client);
    expect(fb.improve).toEqual(["Add a date from the excavation record."]);
  });

  it("falls back to the checklist and says why when AI fails", async () => {
    const { client } = fakeClient({}, 401);
    const fb = await reasoningFeedback(obj, log, [], 3, client);
    expect(fb.via).toBe("rules");
    expect(fb.aiError).toMatch(/401/);
    expect(fb.improve.length).toBeGreaterThan(0);
  });
});
