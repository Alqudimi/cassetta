// Signal Archive design: assertions are explicit, deterministic, and small enough to review in a pull request.
import type { Cassette, JsonValue, ProtocolMessage } from "./index.js";

export type JsonSchemaType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null";

export interface JsonSchema {
  type?: JsonSchemaType;
  enum?: JsonValue[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface CassetteContractEntry {
  sequence: number;
  direction: "request" | "response" | "notification";
  method?: string;
  message: JsonSchema;
}

export interface CassetteContract {
  version: 1;
  entries: CassetteContractEntry[];
}

export interface ContractIssue {
  path: string;
  message: string;
}

const matchesType = (value: JsonValue, type: JsonSchemaType): boolean => {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object")
    return typeof value === "object" && value !== null && !Array.isArray(value);
  if (type === "integer")
    return typeof value === "number" && Number.isInteger(value);
  return typeof value === type;
};

const validateSchema = (
  value: JsonValue | undefined,
  schema: JsonSchema,
  path: string
): ContractIssue[] => {
  const issues: ContractIssue[] = [];
  if (schema.type && !matchesType(value ?? null, schema.type)) {
    issues.push({ path, message: `expected ${schema.type}` });
    return issues;
  }
  if (
    schema.enum &&
    !schema.enum.some(
      candidate => JSON.stringify(candidate) === JSON.stringify(value)
    )
  )
    issues.push({ path, message: "value is not in enum" });

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      issues.push({
        path,
        message: `expected at least ${schema.minItems} items`,
      });
    if (schema.maxItems !== undefined && value.length > schema.maxItems)
      issues.push({
        path,
        message: `expected at most ${schema.maxItems} items`,
      });
    if (schema.items)
      value.forEach((item, index) =>
        issues.push(...validateSchema(item, schema.items!, `${path}[${index}]`))
      );
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const objectValue = value as Record<string, JsonValue>;
    for (const key of schema.required ?? []) {
      if (!(key in objectValue))
        issues.push({
          path: `${path}.${key}`,
          message: "required property is missing",
        });
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (key in objectValue)
        issues.push(
          ...validateSchema(objectValue[key], childSchema, `${path}.${key}`)
        );
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(objectValue)) {
        if (!(key in (schema.properties ?? {})))
          issues.push({
            path: `${path}.${key}`,
            message: "additional property is not allowed",
          });
      }
    }
  }
  return issues;
};

export const validateCassetteContract = (
  cassette: Cassette,
  contract: CassetteContract
): ContractIssue[] => {
  const issues: ContractIssue[] = [];
  if (contract.version !== 1)
    return [
      { path: "contract.version", message: "unsupported contract version" },
    ];
  for (const expected of contract.entries) {
    const actual = cassette.entries.find(
      entry => entry.sequence === expected.sequence
    );
    const path = `entries[${expected.sequence - 1}]`;
    if (!actual) {
      issues.push({ path, message: "expected cassette entry is missing" });
      continue;
    }
    if (actual.direction !== expected.direction)
      issues.push({
        path: `${path}.direction`,
        message: `expected ${expected.direction}`,
      });
    if (
      expected.method !== undefined &&
      actual.message.method !== expected.method
    )
      issues.push({
        path: `${path}.message.method`,
        message: `expected ${expected.method}`,
      });
    issues.push(
      ...validateSchema(actual.message, expected.message, `${path}.message`)
    );
  }
  return issues;
};

export const contractForMessages = (
  entries: Array<{
    sequence: number;
    direction: CassetteContractEntry["direction"];
    message: ProtocolMessage;
    method?: string;
  }>
): CassetteContract => ({
  version: 1,
  entries: entries.map(entry => ({
    sequence: entry.sequence,
    direction: entry.direction,
    ...(entry.method === undefined ? {} : { method: entry.method }),
    message: { type: "object", additionalProperties: true },
  })),
});
