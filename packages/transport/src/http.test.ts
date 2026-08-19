// Signal Archive design: HTTP tests verify boundaries and failure semantics with an injected fetch, never a live service.
import { describe, expect, it, vi } from "vitest";
import { captureHttpSession, HttpTransportError } from "./http";

const response = (body: string, init: ResponseInit = {}): Response =>
  new Response(body, { status: 200, ...init });

describe("HTTP transport", () => {
  it("captures normalized and redacted request/response messages", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        JSON.stringify({
          id: "response-id",
          result: { token: "Bearer live-secret" },
        })
      )
    );

    const result = await captureHttpSession(
      [
        {
          id: "request-id",
          method: "tools/call",
          params: { authorization: "Bearer live-secret" },
        },
      ],
      { endpoint: "https://tools.example.test/rpc", fetchImpl }
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(result.responses[0]).toEqual({
      id: "<volatile-id>",
      result: { token: "<redacted>" },
    });
    expect(result.cassette.entries).toHaveLength(2);
    expect(JSON.stringify(result.cassette)).not.toContain("live-secret");
  });

  it("rejects non-http endpoints before making a request", async () => {
    await expect(
      captureHttpSession([], {
        endpoint: "file:///tmp/cassette",
        fetchImpl: vi.fn(),
      })
    ).rejects.toMatchObject<HttpTransportError>({ code: "INVALID_ENDPOINT" });
  });

  it("converts aborts into a bounded timeout error", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation((_input, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new DOMException("aborted", "AbortError");
            reject(error);
          });
        });
      });

    await expect(
      captureHttpSession([{ method: "tools/list" }], {
        endpoint: "http://127.0.0.1:9/rpc",
        timeoutMs: 1,
        fetchImpl,
      })
    ).rejects.toMatchObject<HttpTransportError>({ code: "TIMEOUT" });
  });

  it("rejects non-2xx responses before parsing the body", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(JSON.stringify({ error: "upstream" }), {
        status: 503,
        statusText: "Unavailable",
      })
    );

    await expect(
      captureHttpSession([{ method: "tools/list" }], {
        endpoint: "https://tools.example.test/rpc",
        fetchImpl,
      })
    ).rejects.toMatchObject<HttpTransportError>({ code: "HTTP_ERROR" });
  });

  it("rejects invalid JSON and oversized responses", async () => {
    const invalidJsonFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response("not-json"));
    await expect(
      captureHttpSession([{ method: "tools/list" }], {
        endpoint: "https://tools.example.test/rpc",
        fetchImpl: invalidJsonFetch,
      })
    ).rejects.toMatchObject<HttpTransportError>({ code: "INVALID_JSON" });

    const oversizedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response("123456789"));
    await expect(
      captureHttpSession([{ method: "tools/list" }], {
        endpoint: "https://tools.example.test/rpc",
        maxResponseBytes: 4,
        fetchImpl: oversizedFetch,
      })
    ).rejects.toMatchObject<HttpTransportError>({ code: "PAYLOAD_TOO_LARGE" });
  });
});
