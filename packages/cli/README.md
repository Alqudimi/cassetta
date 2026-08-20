# @cassetta/cli

The Cassetta CLI turns deterministic JSON-RPC workflow evidence into a repeatable local workflow. It can capture a line-delimited stdio process, replay a cassette offline, diff two cassette files, and validate ordering before CI accepts an artifact.

## Development

From the repository root, run `pnpm build:cli`. The generated `dist/cassetta.mjs` is the package's executable entrypoint and requires Node.js 20 or newer.

## Commands

```text
cassetta capture-stdio <requests.json> <output.cassette.jsonl> <command> [...args]
cassetta replay <cassette.jsonl>
cassetta diff <expected.jsonl> <actual.jsonl>
cassetta check <cassette.jsonl>
```

The CLI never persists a request before it has passed through the core normalization and redaction pipeline. It does not add authentication or make provider calls by itself; the command being captured remains the user's responsibility.

## Signing

Use `cassetta sign <cassette> <private-key.pem> <manifest.json> [key-id]` to create an Ed25519 manifest, then use `cassetta verify-signature <cassette> <manifest.json> <public-key.pem>` as a release or CI gate. Keep private keys outside the repository and inject them only in the controlled signing environment; verification jobs need only the public key and manifest.
