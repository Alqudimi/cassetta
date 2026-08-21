# @cassetta/core

The framework-free domain core for Cassetta. It owns cassette entries, deterministic normalization, secret redaction, JSONL serialization, and behavior diffs.

The core intentionally has no network or provider dependency. Transport adapters and CLI concerns belong outside this package so the same evidence model can be used by a CLI, a test runner, or a future editor.

## Signed manifests

The core also exposes `signCassette` and `verifyCassette` through `src/signing.ts`. Ed25519 signs a canonical behavior payload containing cassette name, sequence, direction, normalized messages, latency, and metadata while excluding volatile entry and creation timestamps. The resulting manifest stores the algorithm, caller-supplied key ID, SHA-256 digest, and base64url signature; it never stores private key material. Key distribution, rotation, and trust policy remain the caller's responsibility.

## Contract assertions

`validateCassetteContract` validates a versioned contract against selected entry sequences. The supported subset covers direction, method, object properties, required keys, enum values, array bounds, nested schemas, and optional additional-property rejection. It intentionally does not claim full JSON Schema compatibility; issues are returned with stable paths for CI and pull-request diagnostics.
