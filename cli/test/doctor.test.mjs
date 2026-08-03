import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const cli = resolve(import.meta.dirname, "../handover.mjs");

test("doctor verifies identity and a context read without exposing the token", async () => {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({
      authorization: request.headers.authorization,
      method: request.method,
      url: request.url,
    });
    response.setHeader("content-type", "application/json");
    if (request.url === "/api/v1/me") {
      response.end(JSON.stringify({
        data: {
          displayName: "Test Agent",
          type: "service_agent",
          organizationName: "Example",
          workspaceName: "General",
          role: "editor",
          scopes: ["handover:read", "handover:write"],
        },
      }));
      return;
    }
    if (request.url === "/api/v1/handovers?limit=1&status=active") {
      response.end(JSON.stringify({ data: { items: [{ id: "h_1" }] } }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: { message: "Not found" } }));
  });
  await new Promise((resolveServer) => server.listen(0, "127.0.0.1", resolveServer));
  const address = server.address();
  assert(address && typeof address === "object");
  const root = await mkdtemp(join(tmpdir(), "handover-doctor-"));
  try {
    const result = await runCli(["doctor", "--json"], {
      HANDOVER_CONFIG: join(root, "missing-config.json"),
      HANDOVER_TOKEN: "secret-test-token",
      HANDOVER_URL: `http://127.0.0.1:${address.port}`,
    });
    assert.equal(result.code, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.ok, true);
    assert.equal(output.identity.displayName, "Test Agent");
    assert.equal(output.contextRead.ok, true);
    assert.equal(output.contextRead.visibleItems, 1);
    assert(!result.stdout.includes("secret-test-token"));
    assert.deepEqual(
      requests.map(({ method, url }) => ({ method, url })),
      [
        { method: "GET", url: "/api/v1/me" },
        { method: "GET", url: "/api/v1/handovers?limit=1&status=active" },
      ],
    );
    assert(requests.every(({ authorization }) => authorization === "Bearer secret-test-token"));
  } finally {
    await new Promise((resolveServer) => server.close(resolveServer));
    await rm(root, { recursive: true, force: true });
  }
});

function runCli(args, env) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [cli, ...args], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolveRun({ code, stderr, stdout }));
  });
}
