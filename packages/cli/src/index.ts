// Signal Archive design: CLI output is operational, concise, and safe to pipe into CI logs.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cassetteFromJsonl, cassetteToJsonl, diffEntries, prepareEntry, type Cassette, type ProtocolMessage } from "../../core/src/index.js";
import { captureStdioSession } from "../../transport/src/stdio.js";

const usage = `Cassetta — deterministic MCP workflow artifacts

Usage:
  cassetta record <input.jsonl> <output.cassette.jsonl>
  cassetta capture-stdio <requests.json> <output.cassette.jsonl> <command> [...args]
  cassetta replay <cassette.jsonl>
  cassetta diff <expected.jsonl> <actual.jsonl>
  cassetta check <cassette.jsonl>
`;

const readCassette = async (file: string): Promise<Cassette> => cassetteFromJsonl(await readFile(resolve(file), "utf8"));

const command = process.argv[2];
const args = process.argv.slice(3);

const main = async (): Promise<void> => {
  if (!command || command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }

  if (command === "record") {
    const [input, output] = args;
    if (!input || !output) throw new Error("record requires an input and output path");
    const source = await readCassette(input);
    const prepared: Cassette = { ...source, entries: source.entries.map((entry) => prepareEntry(entry)) };
    await writeFile(resolve(output), cassetteToJsonl(prepared), "utf8");
    console.log(`recorded ${prepared.entries.length} entries → ${output}`);
    return;
  }

  if (command === "capture-stdio") {
    const [requestsFile, output, executable, ...commandArgs] = args;
    if (!requestsFile || !output || !executable) throw new Error("capture-stdio requires requests, output, and command paths");
    const requests = JSON.parse(await readFile(resolve(requestsFile), "utf8")) as ProtocolMessage[];
    if (!Array.isArray(requests)) throw new Error("requests.json must contain a JSON array");
    const { cassette, stderr } = await captureStdioSession(requests, { command: executable, args: commandArgs, name: output });
    await writeFile(resolve(output), cassetteToJsonl(cassette), "utf8");
    if (stderr) console.error(stderr.trim());
    console.log(`captured ${cassette.entries.length} entries → ${output}`);
    return;
  }

  if (command === "replay") {
    const [file] = args;
    if (!file) throw new Error("replay requires a cassette path");
    const cassette = await readCassette(file);
    console.log(JSON.stringify({ cassette: cassette.name, mode: "offline", entries: cassette.entries }, null, 2));
    return;
  }

  if (command === "diff") {
    const [expectedFile, actualFile] = args;
    if (!expectedFile || !actualFile) throw new Error("diff requires expected and actual cassette paths");
    const expected = await readCassette(expectedFile);
    const actual = await readCassette(actualFile);
    const differences = diffEntries(expected.entries, actual.entries).filter((line) => line.kind !== "same");
    console.log(JSON.stringify({ differences }, null, 2));
    if (differences.length > 0) process.exitCode = 1;
    return;
  }

  if (command === "check") {
    const [file] = args;
    if (!file) throw new Error("check requires a cassette path");
    const cassette = await readCassette(file);
    if (cassette.entries.length === 0) throw new Error("cassette has no entries");
    console.log(`ok: ${cassette.name} contains ${cassette.entries.length} ordered entries`);
    return;
  }

  throw new Error(`unknown command: ${command}`);
};

main().catch((error: unknown) => {
  console.error(`error: ${error instanceof Error ? error.message : "unexpected failure"}`);
  process.exitCode = 2;
});
