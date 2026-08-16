import readline from "node:readline";

const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const request = JSON.parse(line);
  process.stdout.write(`${JSON.stringify({ id: request.id, result: { ok: true, token: "bearer fixture" } })}\n`);
});
