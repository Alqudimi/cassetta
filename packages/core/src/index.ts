// Signal Archive design: the core stays framework-free and evidence-oriented. Domain code uses explicit types, deterministic transforms, and no network access.

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type MessageDirection = "request" | "response" | "notification";

export interface ProtocolMessage {
  id?: string | number;
  method?: string;
  params?: JsonValue;
  result?: JsonValue;
  error?: { code: number; message: string; data?: JsonValue };
  [key: string]: JsonValue | undefined;
}

export interface CassetteEntry {
  sequence: number;
  direction: MessageDirection;
  timestamp: string;
  message: ProtocolMessage;
  latencyMs?: number;
  metadata?: Record<string, string>;
}

export interface Cassette {
  version: 1;
  name: string;
  createdAt: string;
  entries: CassetteEntry[];
}

export interface RedactionPolicy {
  keyPatterns?: RegExp[];
  valuePatterns?: RegExp[];
  replacement?: string;
}

export interface DiffLine {
  kind: "same" | "added" | "removed" | "changed";
  path: string;
  expected?: JsonValue;
  actual?: JsonValue;
}

const DEFAULT_KEY_PATTERNS = [/token/i, /secret/i, /password/i, /api[-_]?key/i, /authorization/i];
const DEFAULT_VALUE_PATTERNS = [/^bearer\s+/i, /sk-[a-z0-9-_]+/i, /ghp_[a-z0-9]+/i];

const isObject = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeValue = (value: JsonValue, path: string): JsonValue => {
  if (Array.isArray(value)) return value.map((item, index) => normalizeValue(item, `${path}[${index}]`));
  if (!isObject(value)) return value;

  const normalized: Record<string, JsonValue> = {};
  for (const key of Object.keys(value).sort()) {
    if (["timestamp", "createdAt", "updatedAt"].includes(key)) {
      normalized[key] = "<volatile-time>";
      continue;
    }
    if (key === "id" && typeof value[key] === "string") {
      normalized[key] = "<volatile-id>";
      continue;
    }
    normalized[key] = normalizeValue(value[key], `${path}.${key}`);
  }
  return normalized;
};

const redactValue = (value: JsonValue, policy: Required<RedactionPolicy>, path = "$"): JsonValue => {
  if (Array.isArray(value)) return value.map((item, index) => redactValue(item, policy, `${path}[${index}]`));
  if (typeof value === "string") {
    return policy.valuePatterns.some((pattern) => pattern.test(value)) ? policy.replacement : value;
  }
  if (!isObject(value)) return value;

  const output: Record<string, JsonValue> = {};
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    output[key] = policy.keyPatterns.some((pattern) => pattern.test(key))
      ? policy.replacement
      : redactValue(child, policy, childPath);
  }
  return output;
};

export const normalizeMessage = (message: ProtocolMessage): ProtocolMessage => normalizeValue(message, "$") as ProtocolMessage;

export const redactMessage = (message: ProtocolMessage, policy: RedactionPolicy = {}): ProtocolMessage => {
  const resolved: Required<RedactionPolicy> = {
    keyPatterns: policy.keyPatterns ?? DEFAULT_KEY_PATTERNS,
    valuePatterns: policy.valuePatterns ?? DEFAULT_VALUE_PATTERNS,
    replacement: policy.replacement ?? "<redacted>",
  };
  return redactValue(message, resolved) as ProtocolMessage;
};

export const prepareEntry = (entry: CassetteEntry, policy?: RedactionPolicy): CassetteEntry => ({
  ...entry,
  message: redactMessage(normalizeMessage(entry.message), policy),
});

export const diffEntries = (expected: CassetteEntry[], actual: CassetteEntry[]): DiffLine[] => {
  const lines: DiffLine[] = [];
  const max = Math.max(expected.length, actual.length);
  for (let index = 0; index < max; index += 1) {
    const left = expected[index];
    const right = actual[index];
    const path = `entries[${index}]`;
    if (!left && right) {
      lines.push({ kind: "added", path, actual: right.message });
      continue;
    }
    if (left && !right) {
      lines.push({ kind: "removed", path, expected: left.message });
      continue;
    }
    const leftMessage = JSON.stringify(normalizeMessage(left.message));
    const rightMessage = JSON.stringify(normalizeMessage(right.message));
    if (leftMessage === rightMessage) lines.push({ kind: "same", path, expected: left.message, actual: right.message });
    else lines.push({ kind: "changed", path, expected: left.message, actual: right.message });
  }
  return lines;
};

export const cassetteToJsonl = (cassette: Cassette): string =>
  [JSON.stringify({ cassette: cassette.name, version: cassette.version, createdAt: cassette.createdAt }), ...cassette.entries.map((entry) => JSON.stringify(entry))].join("\n") + "\n";

export const cassetteFromJsonl = (input: string): Cassette => {
  const lines = input.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) throw new Error("Cassette is empty");
  const header = JSON.parse(lines[0]) as { cassette?: string; version?: number; createdAt?: string };
  if (header.version !== 1 || typeof header.cassette !== "string") throw new Error("Unsupported cassette header");
  const entries = lines.slice(1).map((line, index) => {
    const entry = JSON.parse(line) as CassetteEntry;
    if (entry.sequence !== index + 1) throw new Error(`Invalid sequence at line ${index + 2}`);
    return entry;
  });
  return { version: 1, name: header.cassette, createdAt: header.createdAt ?? "<unknown>", entries };
};
