// Signal Archive design: tests read like evidence checks; each assertion names the behavior a contributor must preserve.
import { describe, expect, it } from "vitest";
import {
  cassetteFromJsonl,
  cassetteToJsonl,
  diffEntries,
  normalizeMessage,
  prepareEntry,
  redactMessage,
  type CassetteEntry,
} from "./index";

const entry = (message: CassetteEntry["message"], sequence = 1): CassetteEntry => ({
  sequence,
  direction: "response",
  timestamp: "2026-08-16T00:00:00.000Z",
  message,
});

describe("Cassetta core", () => {
  it("normalizes volatile fields and object key order", () => {
    expect(normalizeMessage({ z: 1, a: { updatedAt: "today", id: "abc" } })).toEqual({
      a: { id: "<volatile-id>", updatedAt: "<volatile-time>" },
      z: 1,
    });
  });

  it("redacts secret keys and common bearer values", () => {
    expect(redactMessage({ apiKey: "secret", nested: "Bearer abc" })).toEqual({
      apiKey: "<redacted>",
      nested: "<redacted>",
    });
  });

  it("prepares entries by normalizing before redaction", () => {
    expect(prepareEntry(entry({ id: "abc", token: "sk-live" })).message).toEqual({
      id: "<volatile-id>",
      token: "<redacted>",
    });
  });

  it("round-trips a JSONL cassette", () => {
    const cassette = { version: 1 as const, name: "demo", createdAt: "now", entries: [entry({ method: "tools/list" })] };
    expect(cassetteFromJsonl(cassetteToJsonl(cassette))).toEqual(cassette);
  });

  it("rejects malformed sequence numbers", () => {
    expect(() => cassetteFromJsonl('{"cassette":"x","version":1}\n{"sequence":2,"direction":"request","message":{}}\n')).toThrow("Invalid sequence");
  });

  it("reports additions, removals, and changes", () => {
    const result = diffEntries([entry({ method: "tools/list" })], [entry({ method: "tools/call" })]);
    expect(result.map((line) => line.kind)).toEqual(["changed"]);
    expect(diffEntries([], [entry({ method: "tools/list" })])[0].kind).toBe("added");
    expect(diffEntries([entry({ method: "tools/list" })], [])[0].kind).toBe("removed");
  });
});
