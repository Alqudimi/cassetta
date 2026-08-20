import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const outputDir = process.argv[2];
if (!outputDir) throw new Error("output directory is required");

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

await mkdir(outputDir, { recursive: true });
await writeFile(`${outputDir}/private-key.pem`, privateKey, { mode: 0o600 });
await writeFile(`${outputDir}/public-key.pem`, publicKey, { mode: 0o644 });
