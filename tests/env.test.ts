import { describe, expect, it } from "vitest";
import { findApiKey } from "@/lib/env";

describe("findApiKey", () => {
  it("uses ANTHROPIC_API_KEY, trimming spaces and quotes", () => {
    expect(findApiKey({ ANTHROPIC_API_KEY: '  "sk-ant-abc"  ' })).toMatchObject({ key: "sk-ant-abc", from: "ANTHROPIC_API_KEY" });
  });

  it("accepts a misnamed variable when the value is an Anthropic key", () => {
    expect(findApiKey({ CLAUDE_API_KEY: "sk-ant-xyz" })).toMatchObject({ key: "sk-ant-xyz", from: "CLAUDE_API_KEY" });
    expect(findApiKey({ "ANTHROPIC_API_KEY ": "sk-ant-xyz" })).toMatchObject({ key: "sk-ant-xyz" });
  });

  it("reports near misses and empty values without using a non-key value", () => {
    expect(findApiKey({ ANTHROPIC_KEY: "hello" })).toMatchObject({ key: null, nearMisses: ["ANTHROPIC_KEY"] });
    expect(findApiKey({ ANTHROPIC_API_KEY: "   " })).toMatchObject({ key: null, empty: true });
    expect(findApiKey({})).toMatchObject({ key: null, empty: false, nearMisses: [] });
  });
});
