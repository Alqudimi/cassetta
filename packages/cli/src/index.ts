// Signal Archive design: CLI output is operational, concise, and safe to pipe into CI logs.
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  cassetteFromJsonlStream,
  cassetteToJsonl,
  diffEntries,
  prepareEntry,
  type Cassette,
  type DiffLine,
  type ProtocolMessage,
} from "../../core/src/index.js";
import {
  validateCassetteContract,
  type CassetteContract,
} from "../../core/src/assertions.js";
import {
  signCassette,
  verifyCassette,
  type CassetteManifest,
} from "../../core/src/signing.js";
import { captureStdioSession } from "../../transport/src/stdio.js";
import { replayCassette } from "../../transport/src/replay.js";

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const usage = `Cassetta — deterministic MCP workflow artifacts

Usage:
  cassetta record <input.jsonl> <output.cassette.jsonl>
  cassetta capture-stdio <requests.json> <output.cassette.jsonl> <command> [...args]
  cassetta replay <cassette.jsonl> [requests.json] [--json]
  cassetta diff <expected.jsonl> <actual.jsonl> [--json|--sarif]
  cassetta check <cassette.jsonl> [--json|--sarif]
  cassetta sign <cassette.jsonl> <private-key.pem> <manifest.json> [key-id]
  cassetta verify-signature <cassette.jsonl> <manifest.json> <public-key.pem>
  cassetta assert <cassette.jsonl> <contract.json> [--json|--sarif]
`;

const readCassette = async (file: string): Promise<Cassette> =>
  cassetteFromJsonlStream(createReadStream(resolve(file)));

const readJson = async <T>(file: string): Promise<T> => {
  try {
    return JSON.parse(await readFile(resolve(file), "utf8")) as T;
  } catch {
    throw new CliUsageError(`could not parse JSON: ${file}`);
  }
};

const readRequests = async (file: string): Promise<ProtocolMessage[]> => {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(resolve(file), "utf8")) as unknown;
  } catch (error) {
    throw new CliUsageError(`could not parse requests JSON: ${file}`);
  }
  if (!Array.isArray(value))
    throw new CliUsageError("requests.json must contain a JSON array");
  return value as ProtocolMessage[];
};

const parseFlags = (args: string[]) => ({
  positional: args.filter(arg => !arg.startsWith("--")),
  json: args.includes("--json"),
  sarif: args.includes("--sarif"),
});

const sarif = (
  tool: string,
  findings: Array<{ message: string; path: string }>
) => ({
  version: "2.1.0",
  $schema: "https://json.schemastore.org/sarif-2.1.0.json",
  runs: [
    {
      tool: {
        driver: {
          name: "cassetta",
          informationUri: "https://github.com/Alqudimi/cassetta",
        },
      },
      results: findings.map(finding => ({
        ruleId: "cassette-drift",
        level: "error",
        message: { text: finding.message },
        locations: [
          { physicalLocation: { artifactLocation: { uri: finding.path } } },
        ],
      })),
      invocations: [{ executionSuccessful: findings.length === 0 }],
    },
  ],
});

const diffFindings = (differences: DiffLine[]) =>
  differences.map(difference => ({
    path: difference.path,
    message: `${difference.kind} behavior at ${difference.path}`,
  }));

const main = async (): Promise<void> => {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  if (!command || command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }

  const parsed = parseFlags(args);
  const positional = parsed.positional;

  if (command === "record") {
    const [input, output] = positional;
    if (!input || !output)
      throw new CliUsageError("record requires input and output paths");
    const source = await readCassette(input);
    const prepared: Cassette = {
      ...source,
      entries: source.entries.map(entry => prepareEntry(entry)),
    };
    await writeFile(resolve(output), cassetteToJsonl(prepared), "utf8");
    console.log(`recorded ${prepared.entries.length} entries → ${output}`);
    return;
  }

  if (command === "capture-stdio") {
    const [requestsFile, output, executable, ...commandArgs] = positional;
    if (!requestsFile || !output || !executable)
      throw new CliUsageError(
        "capture-stdio requires requests, output, and command paths"
      );
    const requests = await readRequests(requestsFile);
    if (requests.length === 0)
      throw new CliUsageError("capture-stdio requires at least one request");
    const { cassette, stderr } = await captureStdioSession(requests, {
      command: executable,
      args: commandArgs,
      name: output,
    });
    await writeFile(resolve(output), cassetteToJsonl(cassette), "utf8");
    if (stderr) console.error(stderr.trim());
    console.log(`captured ${cassette.entries.length} entries → ${output}`);
    return;
  }

  if (command === "replay") {
    const [file, requestsFile] = positional;
    if (!file) throw new CliUsageError("replay requires a cassette path");
    const cassette = await readCassette(file);
    if (!requestsFile) {
      console.log(
        JSON.stringify(
          {
            cassette: cassette.name,
            mode: "offline",
            entries: cassette.entries,
          },
          null,
          2
        )
      );
      return;
    }
    const result = replayCassette(cassette, await readRequests(requestsFile));
    console.log(
      JSON.stringify(
        { cassette: cassette.name, mode: "offline", ...result },
        null,
        2
      )
    );
    return;
  }

  if (command === "sign") {
    const [cassetteFile, privateKeyFile, manifestFile, keyId = "default"] =
      positional;
    if (!cassetteFile || !privateKeyFile || !manifestFile)
      throw new CliUsageError(
        "sign requires cassette, private key, and manifest paths"
      );
    const manifest = signCassette(
      await readCassette(cassetteFile),
      await readFile(resolve(privateKeyFile)),
      keyId
    );
    await writeFile(
      resolve(manifestFile),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    );
    console.log(`signed ${cassetteFile} → ${manifestFile}`);
    return;
  }

  if (command === "verify-signature") {
    const [cassetteFile, manifestFile, publicKeyFile] = positional;
    if (!cassetteFile || !manifestFile || !publicKeyFile)
      throw new CliUsageError(
        "verify-signature requires cassette, manifest, and public key paths"
      );
    const manifest = await readJson<CassetteManifest>(manifestFile);
    const valid = verifyCassette(
      await readCassette(cassetteFile),
      manifest,
      await readFile(resolve(publicKeyFile))
    );
    console.log(JSON.stringify({ cassette: cassetteFile, valid }, null, 2));
    if (!valid) process.exitCode = 1;
    return;
  }

  if (command === "assert") {
    const [cassetteFile, contractFile] = positional;
    if (!cassetteFile || !contractFile)
      throw new CliUsageError("assert requires cassette and contract paths");
    const issues = validateCassetteContract(
      await readCassette(cassetteFile),
      await readJson<CassetteContract>(contractFile)
    );
    const findings = issues.map(issue => ({
      path: issue.path,
      message: issue.message,
    }));
    console.log(
      JSON.stringify(
        parsed.sarif
          ? sarif("cassetta-contract", findings)
          : { cassette: cassetteFile, valid: issues.length === 0, issues },
        null,
        2
      )
    );
    if (issues.length > 0) process.exitCode = 1;
    return;
  }

  if (command === "diff") {
    const [expectedFile, actualFile] = positional;
    if (!expectedFile || !actualFile)
      throw new CliUsageError(
        "diff requires expected and actual cassette paths"
      );
    const differences = diffEntries(
      (await readCassette(expectedFile)).entries,
      (await readCassette(actualFile)).entries
    ).filter(line => line.kind !== "same");
    const findings = diffFindings(differences);
    console.log(
      JSON.stringify(
        parsed.sarif ? sarif("cassetta", findings) : { differences },
        null,
        2
      )
    );
    if (differences.length > 0) process.exitCode = 1;
    return;
  }

  if (command === "check") {
    const [file] = positional;
    if (!file) throw new CliUsageError("check requires a cassette path");
    const cassette = await readCassette(file);
    if (cassette.entries.length === 0)
      throw new CliUsageError("cassette has no entries");
    const findings = cassette.entries
      .filter(
        (entry, index) => entry.direction === "response" && index % 2 === 0
      )
      .map(entry => ({
        path: `entries[${entry.sequence - 1}]`,
        message: "response is not paired after a request",
      }));
    console.log(
      JSON.stringify(
        parsed.sarif
          ? sarif("cassetta", findings)
          : {
              cassette: cassette.name,
              entries: cassette.entries.length,
              valid: findings.length === 0,
            },
        null,
        2
      )
    );
    if (findings.length > 0) process.exitCode = 1;
    return;
  }

  throw new CliUsageError(`unknown command: ${command}`);
};

main().catch((error: unknown) => {
  const code =
    error instanceof CliUsageError
      ? 2
      : error instanceof Error && error.name === "ReplayMismatchError"
        ? 1
        : 2;
  console.error(
    `error: ${error instanceof Error ? error.message : "unexpected failure"}`
  );
  process.exitCode = code;
});
