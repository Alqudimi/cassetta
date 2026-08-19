// Signal Archive design: HTTP capture is bounded, injectable, and redacts before persistence. It never logs payloads or credentials.
import {
  prepareEntry,
  type Cassette,
  type ProtocolMessage,
} from "../../core/src/index.js";

export class HttpTransportError extends Error {
  readonly code:
    | "INVALID_ENDPOINT"
    | "TIMEOUT"
    | "HTTP_ERROR"
    | "PAYLOAD_TOO_LARGE"
    | "INVALID_JSON";

  constructor(code: HttpTransportError["code"], message: string) {
    super(message);
    this.name = "HttpTransportError";
    this.code = code;
  }
}

export interface HttpCaptureOptions {
  endpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
}

export interface HttpCaptureResult {
  cassette: Cassette;
  responses: ProtocolMessage[];
}

const now = (): string => new Date().toISOString();

const validateEndpoint = (endpoint: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new HttpTransportError(
      "INVALID_ENDPOINT",
      "HTTP endpoint must be a valid URL"
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new HttpTransportError(
      "INVALID_ENDPOINT",
      "HTTP endpoint must use http or https"
    );
  }
};

export const captureHttpSession = async (
  requests: ProtocolMessage[],
  options: HttpCaptureOptions
): Promise<HttpCaptureResult> => {
  validateEndpoint(options.endpoint);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxResponseBytes = options.maxResponseBytes ?? 1_048_576;
  const entries = [];
  const responses: ProtocolMessage[] = [];

  for (const [index, message] of requests.entries()) {
    const sequence = index * 2 + 1;
    const requestEntry = prepareEntry({
      sequence,
      direction: "request",
      timestamp: now(),
      message,
    });
    entries.push(requestEntry);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(options.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", ...options.headers },
        body: JSON.stringify(requestEntry.message),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new HttpTransportError(
          "TIMEOUT",
          `HTTP request ${index + 1} exceeded ${timeoutMs}ms`
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new HttpTransportError(
        "HTTP_ERROR",
        `HTTP request ${index + 1} returned ${response.status}`
      );
    }

    const body = await response.text();
    const bodyBytes = new TextEncoder().encode(body).byteLength;
    if (bodyBytes > maxResponseBytes) {
      throw new HttpTransportError(
        "PAYLOAD_TOO_LARGE",
        `HTTP response ${index + 1} exceeded ${maxResponseBytes} bytes`
      );
    }

    let responseMessage: ProtocolMessage;
    try {
      responseMessage = JSON.parse(body) as ProtocolMessage;
    } catch {
      throw new HttpTransportError(
        "INVALID_JSON",
        `HTTP response ${index + 1} was not valid JSON`
      );
    }
    const responseEntry = prepareEntry({
      sequence: sequence + 1,
      direction: "response",
      timestamp: now(),
      message: responseMessage,
    });
    entries.push(responseEntry);
    responses.push(responseEntry.message);
  }

  return {
    cassette: { version: 1, name: "http-session", createdAt: now(), entries },
    responses,
  };
};
