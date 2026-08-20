// Signal Archive design: signature tests prove tamper detection and stable behavior identity without network or secret fixtures.
import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Cassette } from "./index";
import {
  cassetteSigningPayload,
  signCassette,
  verifyCassette,
} from "./signing";

const cassette = (query: string, timestamp: string): Cassette => ({
  version: 1,
  name: "fixture",
  createdAt: timestamp,
  entries: [
    {
      sequence: 1,
      direction: "request",
      timestamp,
      message: { id: "volatile", method: "tools/call", params: { query } },
    },
    {
      sequence: 2,
      direction: "response",
      timestamp,
      message: { id: "volatile", result: { ok: true } },
    },
  ],
});

describe("cassette signing", () => {
  it("signs and verifies stable behavior with an Ed25519 key pair", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const manifest = signCassette(
      cassette("cassetta", "2026-08-19T00:00:00.000Z"),
      privateKey,
      "ci-key"
    );

    expect(manifest).toMatchObject({
      version: 1,
      algorithm: "ed25519",
      keyId: "ci-key",
    });
    expect(
      verifyCassette(
        cassette("cassetta", "2027-01-01T00:00:00.000Z"),
        manifest,
        publicKey
      )
    ).toBe(true);
  });

  it("rejects behavioral drift and a different public key", () => {
    const first = generateKeyPairSync("ed25519");
    const second = generateKeyPairSync("ed25519");
    const manifest = signCassette(
      cassette("before", "2026-08-19T00:00:00.000Z"),
      first.privateKey
    );

    expect(
      verifyCassette(
        cassette("after", "2026-08-19T00:00:00.000Z"),
        manifest,
        first.publicKey
      )
    ).toBe(false);
    expect(
      verifyCassette(
        cassette("before", "2026-08-19T00:00:00.000Z"),
        manifest,
        second.publicKey
      )
    ).toBe(false);
  });

  it("keeps the signing payload stable across volatile timestamps", () => {
    expect(
      cassetteSigningPayload(cassette("same", "2026-08-19T00:00:00.000Z"))
    ).toBe(
      cassetteSigningPayload(cassette("same", "2028-08-19T00:00:00.000Z"))
    );
  });
});
