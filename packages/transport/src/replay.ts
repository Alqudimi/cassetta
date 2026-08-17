// Signal Archive design: offline replay is deterministic and network-free. It consumes recorded evidence, never executes a provider.
import {
  normalizeMessage,
  prepareEntry,
  type Cassette,
  type CassetteEntry,
  type ProtocolMessage,
} from "../../core/src/index.js";

export class ReplayMismatchError extends Error {
  readonly sequence: number;

  constructor(message: string, sequence: number) {
    super(message);
    this.name = "ReplayMismatchError";
    this.sequence = sequence;
  }
}

export interface ReplayResult {
  responses: ProtocolMessage[];
  matchedPairs: number;
}

const comparable = (message: ProtocolMessage): string =>
  JSON.stringify(normalizeMessage(message));

const pairsFromCassette = (
  cassette: Cassette
): Array<{ request: CassetteEntry; response: CassetteEntry }> => {
  const pairs: Array<{ request: CassetteEntry; response: CassetteEntry }> = [];
  for (let index = 0; index < cassette.entries.length; index += 2) {
    const request = cassette.entries[index];
    const response = cassette.entries[index + 1];
    if (
      !request ||
      request.direction !== "request" ||
      !response ||
      response.direction !== "response"
    ) {
      throw new ReplayMismatchError(
        `Cassette entry ${request?.sequence ?? index + 1} is not a request/response pair`,
        request?.sequence ?? index + 1
      );
    }
    pairs.push({ request, response });
  }
  return pairs;
};

export const replayCassette = (
  cassette: Cassette,
  requests: ProtocolMessage[]
): ReplayResult => {
  const pairs = pairsFromCassette(cassette);
  if (requests.length !== pairs.length) {
    throw new ReplayMismatchError(
      `Expected ${pairs.length} request(s), received ${requests.length}`,
      requests.length + 1
    );
  }

  const responses: ProtocolMessage[] = [];
  for (const [index, request] of requests.entries()) {
    const pair = pairs[index];
    const normalizedActual = comparable(
      prepareEntry({
        sequence: 1,
        direction: "request",
        timestamp: "<now>",
        message: request,
      }).message
    );
    const normalizedExpected = comparable(pair.request.message);
    if (normalizedActual !== normalizedExpected) {
      throw new ReplayMismatchError(
        `Request mismatch at replay pair ${index + 1}; inspect the cassette diff before retrying`,
        pair.request.sequence
      );
    }
    responses.push(pair.response.message);
  }

  return { responses, matchedPairs: pairs.length };
};
