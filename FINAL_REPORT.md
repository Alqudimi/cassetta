# THE FORGE — Final Report

## Executive summary

The selected asset was **Cassetta**, an existing repository in the user’s GitHub account. It was transformed into a focused local-first behavior cassette and regression gate for MCP and JSON-RPC tool workflows. The release now captures a bounded local stdio session, normalizes volatile values, redacts secret-like data before persistence, validates a versioned JSONL artifact, replays recorded behavior offline, reports deterministic drift, and exposes CI-friendly exit codes and SARIF-shaped output.

The work was published as a public GitHub repository at [Alqudimi/cassetta](https://github.com/Alqudimi/cassetta), merged through [pull request #1](https://github.com/Alqudimi/cassetta/pull/1), and released as [v0.5.0](https://github.com/Alqudimi/cassetta/releases/tag/v0.5.0). The release workflow produced the installable asset [`cassetta-cli-0.5.0.tgz`](https://github.com/Alqudimi/cassetta/releases/download/v0.5.0/cassetta-cli-0.5.0.tgz).

## Problem

MCP and AI tool workflows are difficult to reproduce because behavior depends on protocol framing, client/server integration, state, timing, schemas, and sometimes model variability. Community builders describe a repeated edit–restart–reconnect–trigger loop, while other practitioners ask how functional, reliability, security, performance, and protocol tests should be structured. These are direct signals of developer friction, not merely an attractive project narrative.[3] [4]

The chosen problem is narrower than “AI agent evaluation”: **maintainers need a small, portable, reviewable artifact that records a known-good JSON-RPC interaction and can detect behavioral drift without reconnecting to a live provider**. The official MCP Inspector provides interactive Web, CLI, and TUI inspection, and MCPJam provides a broad testing and evaluation platform; Cassetta therefore targets a complementary artifact and gate rather than a competing inspector.[1] [5] [6]

## Discovery

The environment inspection found Ubuntu 24.04 on an x86_64 sandbox with 6 CPUs, approximately 11 GiB RAM, approximately 40 GiB available disk, Node.js 22.13.0, Python 3.12.3, pnpm 11.20.0, Git 2.43.0, GitHub CLI 2.97.0, and no Docker, Go, Rust, or Cargo binaries. GitHub authentication was available for the `Alqudimi` account.

The account inventory contained 100 repositories, 99 original repositories, 708 aggregate stars in the inspected inventory, and 40 Python plus 16 TypeScript primary-language repositories. The strongest repeated skill signal was developer tooling around AI/ML, MCP, replay, testing, security, evidence, Git, and CI. The principal missing signals were limited external traction on recent repositories, inconsistent licensing in the wider inventory, and insufficient proof that every GitHub workflow actually ran successfully.

The opportunity map identified a repeated family of projects: `shipwright`, `proofsmith`, `cassetta`, `PermitWeave`, `driftfence`, `PatchSignal`, `Vouchline`, `ToolAtlas`, `mcp-launchcheck`, and `mcp-conformance-lab`. Rather than create another disconnected tool, the strategy was to deepen one coherent evidence-first asset.

## Competition and rejection

| Alternative              | Evidence                                                                                                                                                              | Decision                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Official MCP Inspector   | Mature reference tool with Web, CLI, and TUI clients; repository inspected with substantial public traction.[1] [5]                                                   | Do not clone. Complement it with committed offline artifacts.        |
| MCPJam                   | Broad local/hosted inspection, multi-client evaluations, traces, OAuth debugging, SDK, and CI capabilities; repository inspected with substantial public traction.[6] | Do not clone. Avoid a dashboard and hosted-service surface.          |
| MCP protocol conformance | The MCP community has an official conformance direction covering protocol-level behavior.[4]                                                                          | Treat conformance as adjacent, not the primary product.              |
| Pact/PactFlow            | Contract testing and can-i-deploy gates catch incompatible provider changes before production.[9]                                                                     | Learn from the pattern without requiring a broker or replacing Pact. |
| Generic agent evaluation | Real production traces and CI gates are valuable, but hosted evaluation platforms already address broad trace/eval needs.[8]                                          | Reject as clone-risk and infrastructure-heavy.                       |

The weighted scorecard ranked Cassetta at **85.5/100**, narrowly ahead of ToolAtlas at **85.0/100**, followed by PatchSignal at 80.5, Shipwright at 75.0, DriftFence at 73.5, and a generic evaluation platform at 63.5. Cassetta won because the external pain was validated, the existing repository already had a coherent core, the product boundary was narrow, and the asset could be strengthened without a speculative rewrite.

## Differentiation

> **For maintainers of MCP and AI tool workflows who suffer from slow, non-reproducible integration debugging, Cassetta provides a local-first behavior cassette that captures, redacts, replays, and gates JSON-RPC sessions offline, unlike interactive inspectors, hosted eval platforms, or protocol-only conformance suites, by treating the session as a portable, reviewable, deterministic artifact.**

The structural differentiator is the **evidence boundary**. Cassetta does not attempt to become an inspector, an LLM judge, a sandbox, or a hosted observability platform. It turns a session into a versioned JSONL artifact that can be committed, reviewed, diffed, replayed without execution, and used as a release gate. The MCP contract-testing literature independently identifies contract-first testing, golden files, traffic recording, replay, and release cloning as important patterns, which supports the chosen direction while also warning against building an unnecessarily broad platform.[7]

## Architecture

The implementation preserves a TypeScript ESM monorepo with three bounded areas. `@cassetta/core` owns types, canonical normalization, redaction, JSONL serialization, cassette validation, and diff models. `@cassetta/transport` owns local process lifetime and JSONL framing. `@cassetta/cli` owns argument parsing, filesystem boundaries, human/JSON/SARIF output, and exit codes.

The MVP uses a **modular monolith with a framework-free domain core**. JSONL was retained because it is streamable, inspectable, diffable in Git, and does not require a database or broker. Replay is data-only: it never spawns a provider, imports provider code, follows URLs, or interprets cassette text as instructions.

The public cassette remains version `1`, with a header line followed by ordered entries. Entries preserve explicit direction, sequence, timestamp, message, optional latency, and optional metadata. Unknown versions, invalid sequences, invalid directions, invalid timestamps, invalid messages, and negative latency are rejected with typed `CassetteFormatError` diagnostics.

## Stack

| Layer            | Choice                                       | Rationale                                                            |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Language         | TypeScript ESM                               | Existing asset, strong type contracts, alignment with MCP ecosystem. |
| Package manager  | pnpm                                         | Existing lockfile and reproducible workspace scripts.                |
| Build            | esbuild and Vite                             | Small CLI bundle plus preserved product surface.                     |
| Test             | Vitest                                       | Existing test runner and fast unit/integration feedback.             |
| Artifact         | Versioned JSONL                              | Portable, human-readable, diffable evidence.                         |
| Runtime boundary | Node child process over line-delimited stdio | Narrow local MVP without network or provider dependency.             |
| CI integration   | GitHub Actions and SARIF-shaped output       | Gate behavior in pull requests and feed GitHub-compatible tooling.   |
| Distribution     | npm-compatible tarball                       | Natural install path without requiring registry credentials.         |

## Implementation

The core now validates cassette headers and entries before serialization and after parsing. Redaction and normalization remain deterministic, and synthetic fixtures use visible angle-bracket placeholders rather than credential-like strings.

The stdio adapter now validates executable and timeout inputs, passes arguments through `spawn` with `shell: false`, handles stream errors and early exits, rejects malformed JSON, bounds response waits, records stderr separately, and cleans up child processes in failure paths.

The CLI now supports request-aware offline replay. `replay <cassette> [requests.json]` returns recorded responses only after normalized request matching; it never starts a provider. `diff` returns exit code `1` for behavioral differences, while malformed input, usage errors, transport failures, and cassette-format failures return `2`. `--sarif` emits a SARIF 2.1.0-shaped report suitable for CI integration.

The repository surface now includes an architecture contract, three ADRs, a failure matrix, a threat model, a verification record, a product README, changelog entry, CI smoke command, release workflow, issue template, PR template, and contribution/security guidance.

## Testing

The local quality gate produced the following evidence:

| Test area        |                                                                                                                    Result |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------: |
| Type check       |                                                                                                      `pnpm check` passed. |
| Core suite       |                                                                                                           8 tests passed. |
| Transport suite  | 7 tests passed, including timeout, malformed output, missing executable, replay success, mismatch, and malformed pairing. |
| CLI smoke        |                                            Capture, check, offline replay, and equal diff passed through `pnpm test:cli`. |
| Full build       |                                                                        Vite surface, server bundle, and CLI bundle built. |
| Formatting       |                                                                                               `pnpm format:check` passed. |
| Dependency audit |                                                        `pnpm audit --audit-level high` reported no known vulnerabilities. |
| Clean package    |           `@cassetta/cli@0.5.0` tarball installed into an isolated npm prefix and its binary passed `--help` and `check`. |

The hosted pull-request CI run [32165875983](https://github.com/Alqudimi/cassetta/actions/runs/32165875983) completed successfully. The corrected release workflow [32166244615](https://github.com/Alqudimi/cassetta/actions/runs/32166244615) also completed successfully, running type checking, formatting, core tests, transport tests, CLI smoke, CLI build, and package creation.

## Security

The threat model covers source-adjacent payloads, credentials, local process execution, cassette integrity, filesystem boundaries, untrusted child output, and CI log leakage. The implemented mitigations include redaction before persistence, explicit non-network replay, argv-based spawning without a shell, bounded response timeouts, typed validation, and no interpretation of cassette payloads as executable instructions.

A repository secret-pattern scan passed after synthetic bearer fixtures were replaced with angle-bracket placeholders. `pnpm audit --audit-level high` reported no known vulnerabilities at verification time. These checks do not prove that arbitrary business-sensitive content is absent, nor do they sandbox a local executable explicitly supplied by a user.

## Performance

A local smoke baseline ran 20 repeated offline `check` commands against a captured cassette. The measured elapsed time was **0.921 seconds**, with **0.760 seconds user time**, **0.173 seconds system time**, and the measurement was intentionally treated as a sandbox-local baseline rather than a cross-machine benchmark. The offline path is linear in cassette entries and has no database or network round trip in its critical path.

## GitHub publication

| Surface       | Evidence                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Repository    | [github.com/Alqudimi/cassetta](https://github.com/Alqudimi/cassetta)                                                           |
| Visibility    | **VERIFIED** public repository.                                                                                                |
| License       | **VERIFIED** MIT license metadata.                                                                                             |
| Branch        | **VERIFIED** `main`.                                                                                                           |
| Pull request  | **VERIFIED** [#1 merged](https://github.com/Alqudimi/cassetta/pull/1).                                                         |
| Main commit   | **VERIFIED** [`33eef5e`](https://github.com/Alqudimi/cassetta/commit/33eef5e6c3147e84002faf6738bae61ba7b4103f).                |
| Topics        | **VERIFIED** developer-tools, MCP, AI agents, replay, testing, CI, and Open Source topics were added.                          |
| Release       | **VERIFIED** [v0.5.0](https://github.com/Alqudimi/cassetta/releases/tag/v0.5.0).                                               |
| Release asset | **VERIFIED** [`cassetta-cli-0.5.0.tgz`](https://github.com/Alqudimi/cassetta/releases/download/v0.5.0/cassetta-cli-0.5.0.tgz). |
| Actions       | **VERIFIED** pull-request CI and release workflow completed successfully.                                                      |

At final audit time, GitHub reported zero stars and zero forks. That is an honest launch baseline, not evidence of adoption. GitHub Discussions remained disabled, and the API did not expose a `security_policy_url` despite the repository containing security documentation; those are follow-up hardening items rather than claims of completed configuration.

## Limitations

The MVP supports local line-delimited stdio capture and offline replay. Streamable HTTP, OAuth behavior, full MCP protocol conformance, semantic equivalence, model evaluation, signed manifests, sandboxing, cross-platform validation, and SARIF upload to GitHub Code Scanning remain outside verified scope. Vite also emits pre-existing optional analytics-placeholder warnings during the preserved web-surface build.

The current artifact is intentionally strict. A behaviorally compatible response that differs structurally may fail a baseline comparison. Future schema-aware assertions can add controlled flexibility, but loosening the default gate would weaken its proof value.

## Next evolution

The next logical step is not a dashboard. It is a focused SDK-native MCP adapter and a small schema-aware assertion layer that preserves the evidence boundary. After that, a signed cassette manifest, a human-readable drift report, and optional GitHub Action annotations can be evaluated. HTTP/OAuth support should be added only when a concrete user workflow and failure evidence justify the complexity budget.

## Final quality assessment

| Area                  | Score / 10 | Basis                                                                                                                       |
| --------------------- | ---------: | --------------------------------------------------------------------------------------------------------------------------- |
| Problem               |          9 | External community and practitioner evidence supports repeated reproducibility and testing pain.                            |
| Product               |          8 | Narrow, useful MVP with explicit non-goals; broader transports remain future work.                                          |
| Originality           |          8 | Differentiated as a local evidence boundary rather than an inspector or hosted evaluator.                                   |
| Architecture          |          9 | Clear core/transport/CLI boundaries, ADRs, and a bounded threat model.                                                      |
| Code quality          |          8 | Typed validation, cleanup, deterministic transforms, and focused modules; further cross-platform review remains.            |
| Testing               |          8 | Core, transport, CLI smoke, failure, package, and hosted CI evidence are present.                                           |
| Security              |          8 | Secure defaults and threat model are implemented; no sandbox or arbitrary data-leak guarantee is claimed.                   |
| Performance           |          8 | Critical offline path measured with a reproducible local baseline, not an invented benchmark.                               |
| UX                    |          8 | CLI quick start and stable exit semantics are documented; interactive UI is not the core surface.                           |
| Documentation         |          9 | README, architecture, ADRs, security, contribution, verification, and release docs are present.                             |
| Open Source readiness |          8 | Public MIT repository, merged PR, CI, release asset, and topics are verified; discussions/security metadata need follow-up. |
| GitHub presentation   |          8 | Clear README, badge, release, topics, and product positioning; adoption is not yet established.                             |

## Final principle

Cassetta is now justified on GitHub because its existence is tied to a real, validated engineering problem and its repository demonstrates a bounded proof: a maintainer can capture, inspect, replay, compare, test, and release a JSON-RPC behavior artifact without trusting a hosted service.

## References

[1]: https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector "MCP Inspector documentation"
[2]: https://docs.github.com/en/code-security/concepts/code-scanning/sarif-files "About SARIF files for code scanning"
[3]: https://www.reddit.com/r/mcp/comments/1v5gqi8/is_testing_mcp_servers_just_painful_right_now/ "Is testing MCP servers just painful right now?"
[4]: https://www.reddit.com/r/mcp/comments/1mlq5dl/mcp_server_test_strategy/ "MCP Server Test Strategy"
[5]: https://github.com/modelcontextprotocol/inspector "Official MCP Inspector repository"
[6]: https://github.com/MCPJam/inspector "MCPJam Inspector repository"
[7]: https://github.com/cisco-open/mcptoolkit-test/blob/main/docs/maintainers/mcp-contract-testing-methodology.md "MCP Contract Testing Methodology"
[8]: https://arize.com/blog/why-testing-ai-agents-is-non-negotiable/ "AI agent evaluation: How to test, debug, and improve agents in production"
[9]: https://smartbear.com/blog/practice-what-you-pact-catch-breaking-api-changes-before-production-in-the-smartbear-mcp/ "Practice what you Pact: Catch breaking API changes before production in the SmartBear MCP"
[10]: https://docs.github.com/en/code-security/concepts/code-scanning/sarif-files "About SARIF files for code scanning"
