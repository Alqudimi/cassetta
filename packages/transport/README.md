# @cassetta/transport

`@cassetta/transport` contains Cassetta's first process boundary: a bounded line-delimited JSON-RPC stdio session. It writes one request per line, reads one response per request, captures latency, and passes both messages through the core's normalization and redaction pipeline before returning a cassette.

The adapter does not discover tools, authenticate to providers, or make network requests. It is intentionally transport-shaped so future MCP SDK and Streamable HTTP adapters can reuse the same cassette contract. Process errors, invalid JSON, empty sessions, and response timeouts are surfaced as `StdioTransportError`.

The package also exposes `replayCassette`. It consumes a cassette and a list of requests, compares normalized messages strictly, and returns the recorded responses without starting a process. Drift is surfaced as `ReplayMismatchError` with the relevant cassette sequence; this makes it suitable for deterministic CI assertions.

`captureHttpSession` uses an injected or native `fetch` to POST one JSON-RPC request at a time. It accepts only `http` and `https` endpoints, defaults to a 10-second timeout and a 1 MiB response limit, and supports caller-supplied headers without ever logging them. `HttpTransportError` distinguishes invalid endpoints, timeouts, non-2xx responses, invalid JSON, and oversized bodies.
