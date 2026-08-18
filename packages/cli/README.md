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
