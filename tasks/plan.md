# Implementation Plan: Cassetta Forge Release

## Overview

Cassetta will be hardened from an early local-first prototype into a focused Open Source release for deterministic MCP/JSON-RPC behavior evidence. The work preserves the existing TypeScript ESM monorepo and cassette v1 format while completing the critical path: capture, normalize, redact, validate, replay offline, diff, report, and gate in CI.

## Architecture decisions

The domain core remains framework-free and network-free. Transport adapters own process lifetime and framing. The CLI owns filesystem boundaries, output modes, and exit codes. JSONL remains the persisted artifact because it is streamable, diffable, inspectable, and easy to commit. No database, hosted service, LLM, Docker dependency, or browser runtime is required for the MVP.

The selected contract and threat model are documented in [`docs/architecture.md`](../docs/architecture.md). The repository’s existing public commands are preserved where practical; behavior is extended additively, with mismatch and invalid-input outcomes made explicit rather than silently successful.

## Dependency graph

```text
Cassette types and invariants
    ↓
Canonical normalization + redaction + JSONL parser
    ↓
Diff/replay domain services
    ↓
Stdio capture adapter
    ↓
CLI commands and output contracts
    ↓
Fixtures, CI, package, documentation, release
```

## Phase 1: Contract hardening

### Task 1: Validate and canonicalize cassette input

**Acceptance criteria:** cassette headers, versions, sequences, directions, and JSON values are validated; malformed input raises a typed error with line/sequence context; round-trip serialization remains deterministic.

**Verification:** core unit tests pass; malformed JSONL and unsupported versions are covered; existing cassette fixtures remain readable.

**Dependencies:** None. **Scope:** Medium.

### Task 2: Make redaction and normalization explicit

**Acceptance criteria:** normalization occurs before redaction; default policies cover documented secret keys and bearer-like values; custom policies are deterministic; reports never include raw matched secret values.

**Verification:** positive and negative tests cover nested objects, arrays, value patterns, custom replacement, IDs, timestamps, and key ordering.

**Dependencies:** Task 1. **Scope:** Small.

## Checkpoint: Core

The core package must type-check, pass focused tests, and read/write the existing v1 fixtures before transport work proceeds.

## Phase 2: Capture and replay

### Task 3: Harden stdio lifecycle and framing

**Acceptance criteria:** capture passes executable and argv without a shell; it handles spawn errors, process exit, malformed JSON, timeout, stderr, and cleanup deterministically; empty requests are rejected before spawn.

**Verification:** integration fixtures cover success, timeout, invalid JSON, early exit, non-zero exit, stderr, and multiple request/response pairs.

**Dependencies:** Tasks 1–2. **Scope:** Large; split by failure case if needed.

### Task 4: Complete offline replay contract

**Acceptance criteria:** replay never starts a provider or opens a network connection; supplied requests are normalized and compared against cassette pairs; mismatch output identifies pair and path; inspection-only replay remains available as an explicit mode if needed.

**Verification:** replay success, count mismatch, request mismatch, malformed pair, and side-effect absence tests pass.

**Dependencies:** Task 1. **Scope:** Medium.

## Checkpoint: Critical path

A clean fixture server can be captured, persisted, loaded, replayed offline, and rejected with a useful non-zero result when behavior drifts.

## Phase 3: Diff and CI surface

### Task 5: Stabilize diff/report outputs

**Acceptance criteria:** equal cassettes return zero; differences return one; invalid inputs return two; JSON output is stable; human output includes sequence and evidence path; output is safe for CI logs.

**Verification:** CLI smoke tests assert stdout shape and exit codes for equal, changed, added, removed, malformed, and missing files.

**Dependencies:** Tasks 1–4. **Scope:** Medium.

### Task 6: Add SARIF and GitHub Action example

**Acceptance criteria:** diff/validation findings can be emitted as valid SARIF 2.1.0 with rule, message, and location-like evidence; a minimal workflow runs the gate without secrets or hosted services.

**Verification:** parse generated SARIF, run workflow syntax checks where available, and exercise the fixture repository locally.

**Dependencies:** Task 5. **Scope:** Medium.

## Phase 4: Failure, security, and performance lab

### Task 7: Execute the failure matrix and threat model

**Acceptance criteria:** tests cover invalid, empty, large, concurrent, missing-config, network-isolation, database-irrelevant, invalid-credential, and unexpected-data conditions; unsafe shell/path behavior is rejected; replay has no provider side effect.

**Verification:** full tests, dependency audit, secret scan, and a red-team checklist are recorded in `docs/verification.md`.

**Dependencies:** Tasks 3–6. **Scope:** Large; divide into failure and security slices.

### Task 8: Measure only critical paths

**Acceptance criteria:** capture/replay/diff benchmark inputs and method are documented; no fabricated baseline is used; results are used only to catch regressions or explain limits.

**Verification:** benchmark command runs in the available environment and writes a reproducible report.

**Dependencies:** Tasks 4–5. **Scope:** Small.

## Phase 5: Open Source product surface

### Task 9: Rewrite documentation for conversion

**Acceptance criteria:** README answers what, why, who, how, installation, first run, CI, limitations, and contribution path within the first screen and quick start; every command in README is tested.

**Verification:** clean checkout runs all documented commands; links and examples are checked.

**Dependencies:** Tasks 1–8. **Scope:** Medium.

### Task 10: Harden contribution and release surfaces

**Acceptance criteria:** LICENSE, SECURITY, CODE_OF_CONDUCT, CONTRIBUTING, CHANGELOG, issue templates, PR template, architecture docs, and release workflow are coherent and accurate.

**Verification:** repository checklist and clean-install test pass.

**Dependencies:** Task 9. **Scope:** Medium.

## Phase 6: Release candidate and publication

### Task 11: Clean-room build and package verification

**Acceptance criteria:** fresh install, type check, tests, build, package tarball install, CLI smoke, and documentation examples pass without local-only paths or undeclared files.

**Verification:** commands and evidence captured in `docs/verification.md`.

**Dependencies:** Tasks 1–10. **Scope:** Medium.

### Task 12: GitHub release and post-launch audit

**Acceptance criteria:** logical commits are pushed, Actions and security configuration are verified where permissions allow, a release tag/artifact is created, and the online README/package path is checked.

**Verification:** repository URL, branch, commits, release, workflows, and limitations are recorded in the final report with VERIFIED/PARTIALLY VERIFIED/NOT VERIFIED labels.

**Dependencies:** Task 11. **Scope:** Medium.

## Risks and mitigations

| Risk                                                     | Impact | Mitigation                                                                           |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Existing cassette users depend on observable v1 behavior | High   | Additive changes, fixtures, explicit version checks, regression tests.               |
| Redaction misses business-sensitive values               | High   | Policy customization, warnings, synthetic fixtures, never claim perfect discovery.   |
| Replay gives false confidence                            | High   | Strict scope, explicit non-goals, no claim of full protocol or semantic coverage.    |
| Stdio framing differs across servers                     | Medium | Narrow adapter contract, clear errors, future transport adapters behind interfaces.  |
| GitHub permissions or Actions limitations                | Medium | Verify what is possible; document anything not verified instead of claiming success. |

## Definition of done

The MVP is complete only when it is useful without a hosted service, installable from a clean checkout, tested on success and failure paths, secure by default, documented with executable commands, and backed by a GitHub repository and evidence report.
