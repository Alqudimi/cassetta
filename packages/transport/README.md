# @cassetta/transport

`@cassetta/transport` contains Cassetta's first process boundary: a bounded line-delimited JSON-RPC stdio session. It writes one request per line, reads one response per request, captures latency, and passes both messages through the core's normalization and redaction pipeline before returning a cassette.

The adapter does not discover tools, authenticate to providers, or make network requests. It is intentionally transport-shaped so future MCP SDK and Streamable HTTP adapters can reuse the same cassette contract. Process errors, invalid JSON, empty sessions, and response timeouts are surfaced as `StdioTransportError`.
