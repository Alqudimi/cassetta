// Signal Archive design: contract tests focus on actionable drift paths rather than broad schema completeness.
import { describe, expect, it } from "vitest";
import type { Cassette } from "./index";
import { validateCassetteContract, type CassetteContract } from "./assertions";

const sample: Cassette = {
  version: 1,
  name: "contract-fixture",
  createdAt: "<volatile-time>",
  entries: [
    {
      sequence: 1,
      direction: "request",
      timestamp: "<volatile-time>",
      message: {
        id: "<volatile-id>",
        method: "tools/call",
        params: { query: "cassetta" },
      },
    },
    {
      sequence: 2,
      direction: "response",
      timestamp: "<volatile-time>",
      message: {
        id: "<volatile-id>",
        result: { ok: true, values: ["a", "b"] },
      },
    },
  ],
};

describe("cassette contract assertions", () => {
  it("accepts a matching request and response contract", () => {
    const contract: CassetteContract = {
      version: 1,
      entries: [
        {
          sequence: 1,
          direction: "request",
          method: "tools/call",
          message: {
            type: "object",
            required: ["method", "params"],
            properties: { params: { type: "object", required: ["query"] } },
          },
        },
        {
          sequence: 2,
          direction: "response",
          message: {
            type: "object",
            required: ["result"],
            properties: {
              result: {
                type: "object",
                required: ["ok", "values"],
                properties: {
                  ok: { enum: [true] },
                  values: {
                    type: "array",
                    minItems: 2,
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      ],
    };

    expect(validateCassetteContract(sample, contract)).toEqual([]);
  });

  it("returns actionable issues for drift and unsafe shape", () => {
    const issues = validateCassetteContract(sample, {
      version: 1,
      entries: [
        {
          sequence: 1,
          direction: "response",
          method: "tools/list",
          message: {
            type: "object",
            required: ["missing"],
            additionalProperties: false,
            properties: { method: { enum: ["tools/list"] } },
          },
        },
        {
          sequence: 2,
          direction: "response",
          message: {
            type: "object",
            properties: { result: { type: "array", minItems: 3 } },
          },
        },
        {
          sequence: 3,
          direction: "response",
          message: { type: "object" },
        },
      ],
    });

    expect(issues.map(issue => issue.path)).toEqual([
      "entries[0].direction",
      "entries[0].message.method",
      "entries[0].message.missing",
      "entries[0].message.method",
      "entries[0].message.id",
      "entries[0].message.params",
      "entries[1].message.result",
      "entries[2]",
    ]);
  });

  it("rejects unsupported contract versions", () => {
    expect(
      validateCassetteContract(sample, {
        version: 2,
        entries: [],
      } as unknown as CassetteContract)
    ).toEqual([
      { path: "contract.version", message: "unsupported contract version" },
    ]);
  });
});
