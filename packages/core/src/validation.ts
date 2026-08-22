import type { Cassette, CassetteEntry, JsonValue } from "./index.js";

export class CassetteFormatError extends Error {
  readonly line?: number;
  readonly sequence?: number;

  constructor(
    message: string,
    details: { line?: number; sequence?: number } = {}
  ) {
    super(message);
    this.name = "CassetteFormatError";
    this.line = details.line;
    this.sequence = details.sequence;
  }
}

export class CassetteSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CassetteSizeError";
  }
}

/** Default upper bound for a single cassette line, in bytes. */
export const MAX_LINE_BYTES = 64 * 1024;

/** Default upper bound for a complete cassette file, in bytes. */
export const MAX_CASSETTE_BYTES = 16 * 1024 * 1024;

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(isJsonValue);
};

const isDirection = (value: unknown): value is CassetteEntry["direction"] =>
  value === "request" || value === "response" || value === "notification";

export const validateCassetteEntry = (
  value: unknown,
  expectedSequence?: number,
  line?: number
): CassetteEntry => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CassetteFormatError("Cassette entry must be a JSON object", {
      line,
    });

  const entry = value as Partial<CassetteEntry>;
  if (!Number.isInteger(entry.sequence) || entry.sequence < 1)
    throw new CassetteFormatError("Cassette entry has an invalid sequence", {
      line,
    });
  if (expectedSequence !== undefined && entry.sequence !== expectedSequence)
    throw new CassetteFormatError(
      `Invalid sequence at line ${line ?? "unknown"}: expected ${expectedSequence}, received ${entry.sequence}`,
      { line, sequence: entry.sequence }
    );
  if (!isDirection(entry.direction))
    throw new CassetteFormatError(
      `Invalid direction at sequence ${entry.sequence}`,
      {
        line,
        sequence: entry.sequence,
      }
    );
  if (typeof entry.timestamp !== "string")
    throw new CassetteFormatError(
      `Missing timestamp at sequence ${entry.sequence}`,
      {
        line,
        sequence: entry.sequence,
      }
    );
  if (
    !entry.message ||
    typeof entry.message !== "object" ||
    Array.isArray(entry.message)
  )
    throw new CassetteFormatError(
      `Invalid message at sequence ${entry.sequence}`,
      {
        line,
        sequence: entry.sequence,
      }
    );
  if (!isJsonValue(entry.message))
    throw new CassetteFormatError(
      `Message contains a non-JSON value at sequence ${entry.sequence}`,
      {
        line,
        sequence: entry.sequence,
      }
    );
  if (
    entry.latencyMs !== undefined &&
    (!Number.isFinite(entry.latencyMs) || entry.latencyMs < 0)
  )
    throw new CassetteFormatError(
      `Invalid latency at sequence ${entry.sequence}`,
      {
        line,
        sequence: entry.sequence,
      }
    );

  return entry as CassetteEntry;
};

export const validateCassette = (cassette: Cassette): Cassette => {
  if (cassette.version !== 1)
    throw new CassetteFormatError(
      `Unsupported cassette version: ${String(cassette.version)}`
    );
  if (!cassette.name || typeof cassette.name !== "string")
    throw new CassetteFormatError("Cassette name is required");
  if (!Array.isArray(cassette.entries))
    throw new CassetteFormatError("Cassette entries must be an array");
  cassette.entries.forEach((entry, index) =>
    validateCassetteEntry(entry, index + 1)
  );
  return cassette;
};
