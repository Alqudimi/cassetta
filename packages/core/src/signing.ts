// Signal Archive design: signatures cover stable cassette behavior, not volatile timestamps. Private keys never enter cassette files.
import {
  createHash,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyLike,
} from "node:crypto";
import type { Cassette, JsonValue } from "./index.js";
import { normalizeMessage } from "./index.js";

export interface CassetteManifest {
  version: 1;
  algorithm: "ed25519";
  keyId: string;
  digest: string;
  signature: string;
}

const canonicalize = (value: JsonValue): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const cassetteSigningPayload = (cassette: Cassette): string =>
  canonicalize({
    version: cassette.version,
    name: cassette.name,
    entries: cassette.entries.map(entry => ({
      sequence: entry.sequence,
      direction: entry.direction,
      message: normalizeMessage(entry.message),
      ...(entry.latencyMs === undefined ? {} : { latencyMs: entry.latencyMs }),
      ...(entry.metadata === undefined ? {} : { metadata: entry.metadata }),
    })),
  } as unknown as JsonValue);

const digestPayload = (payload: string): string =>
  createHash("sha256").update(payload, "utf8").digest("hex");

const fromBase64Url = (value: string): Buffer =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export const signCassette = (
  cassette: Cassette,
  privateKey: KeyLike,
  keyId = "default"
): CassetteManifest => {
  const payload = cassetteSigningPayload(cassette);
  const digest = digestPayload(payload);
  const signature = cryptoSign(null, Buffer.from(payload, "utf8"), privateKey);
  return {
    version: 1,
    algorithm: "ed25519",
    keyId,
    digest,
    signature: signature.toString("base64url"),
  };
};

export const verifyCassette = (
  cassette: Cassette,
  manifest: CassetteManifest,
  publicKey: KeyLike
): boolean => {
  if (manifest.version !== 1 || manifest.algorithm !== "ed25519") return false;
  const payload = cassetteSigningPayload(cassette);
  if (digestPayload(payload) !== manifest.digest) return false;
  return cryptoVerify(
    null,
    Buffer.from(payload, "utf8"),
    publicKey,
    fromBase64Url(manifest.signature)
  );
};
