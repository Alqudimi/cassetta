# @cassetta/core

The framework-free domain core for Cassetta. It owns cassette entries, deterministic normalization, secret redaction, JSONL serialization, and behavior diffs.

The core intentionally has no network or provider dependency. Transport adapters and CLI concerns belong outside this package so the same evidence model can be used by a CLI, a test runner, or a future editor.
