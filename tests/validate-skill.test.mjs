import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validator = new URL(
  "../templates/handover-skill/validate.mjs",
  import.meta.url,
);

test("accepts a complete Handover skill contract", async () => {
  const root = await mkdtemp(join(tmpdir(), "handover-skill-"));
  const folder = join(root, "example-skill");
  await mkdir(folder);
  const file = join(folder, "SKILL.md");
  await writeFile(
    file,
    `---
name: example-skill
description: Publish a verified record. Use when another actor must continue the work.
license: MIT
compatibility: Requires Handover MCP or the handover-sh CLI.
metadata:
  author: example
  version: "1.0.0"
---

# Example

Call \`handover.whoami\` before protected work. Keep credentials out of output,
use the smallest workspace scope, stop when access is denied, and verify the
result by reading it back.
`,
  );

  const run = spawnSync(process.execPath, [validator.pathname, file, "--json"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const result = JSON.parse(run.stdout);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("rejects mismatched names and missing Handover guarantees", async () => {
  const root = await mkdtemp(join(tmpdir(), "handover-skill-"));
  const folder = join(root, "wrong-folder");
  await mkdir(folder);
  const file = join(folder, "SKILL.md");
  await writeFile(
    file,
    `---
name: Example_Skill
description: Helps.
---

# Example

Do the task.
`,
  );

  const run = spawnSync(process.execPath, [validator.pathname, file, "--json"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 1);
  const result = JSON.parse(run.stdout);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /name must be/);
  assert.match(result.errors.join("\n"), /license is required/);
  assert.match(result.errors.join("\n"), /Verify the server-resolved/);
});
