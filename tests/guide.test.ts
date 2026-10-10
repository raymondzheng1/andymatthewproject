import { describe, expect, it } from "vitest";
import { checkReply, isIdentityQuestion, offlineAnswer, revealsIdentity } from "@/lib/guide";
import { OBJECTS, findPassage, getObject } from "@/lib/objects";
import type { GuideMessage } from "@/lib/schema";

const obj = getObject("a-014")!;
const at = "2026-01-01T00:00:00.000Z";

describe("identity questions", () => {
  it.each([
    "What is it?",
    "what is this",
    "So is it a tool or a weapon?",
    "Is it a chisel?",
    "What was it used for?",
    "What did people use it for?",
    "Just tell me what it is",
    "What kind of object is this?",
    "Is it used for cutting?",
  ])("blocks %j", (q) => {
    expect(isIdentityQuestion(q)).toBe(true);
    const reply = offlineAnswer(q, obj, [], at);
    expect(reply.kind).toBe("blocked");
    expect(revealsIdentity(reply.text, obj)).toBe(false);
  });

  it.each([
    "What is it made of?",
    "Where was it found?",
    "How old is layer 3?",
    "What marks are on the edges?",
    "Is it copper or bronze?",
    "What was found near it?",
  ])("allows %j", (q) => {
    expect(isIdentityQuestion(q)).toBe(false);
  });
});

describe("answers come only from the object's sources", () => {
  it("answers material questions from the conservation report, labeled as fact", () => {
    const r = offlineAnswer("What is it made of?", obj, [], at);
    expect(r.kind).toBe("answer");
    expect(r.label).toBe("fact");
    expect(findPassage(obj, r.sourceId!)?.source.title).toBe("Conservation report");
    expect(r.dictionary.length).toBeGreaterThan(0);
  });

  it("answers find-spot questions from the excavation record", () => {
    const r = offlineAnswer("Where was it found?", obj, [], at);
    expect(r.label).toBe("record");
    expect(r.sourceId).toBe("a14-exc-find");
  });

  it("redirects when no source answers", () => {
    expect(offlineAnswer("Who is the prime minister?", obj, [], at).kind).toBe("redirect");
  });

  it("no source passage or dictionary entry names its object", () => {
    for (const o of OBJECTS) {
      for (const s of o.sources) {
        for (const p of s.passages) {
          expect(revealsIdentity(p.text, o), p.id).toBe(false);
          for (const d of p.dictionary) expect(revealsIdentity(`${d.term} ${d.definition}`, o), d.term).toBe(false);
        }
      }
    }
  });
});

describe("checkReply safety net", () => {
  it("replaces a reply that names the object", () => {
    const leaky: GuideMessage = { from: "guide", at, kind: "answer", text: "This is a bronze chisel.", label: "fact", sourceId: "a14-cons-material", dictionary: [] };
    expect(checkReply(leaky, obj, at).kind).toBe("blocked");
  });

  it("replaces an answer citing a passage that is not in this object's sources", () => {
    const outside: GuideMessage = { from: "guide", at, kind: "answer", text: "It is old.", label: "fact", sourceId: "p1-card-material", dictionary: [] };
    expect(checkReply(outside, obj, at).kind).toBe("redirect");
  });

  it("passes a grounded answer through", () => {
    const ok = offlineAnswer("What is it made of?", obj, [], at);
    expect(checkReply(ok, obj, at)).toEqual(ok);
  });
});
