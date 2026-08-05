import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const skillUrl = new URL("../skills/handoff/SKILL.md", import.meta.url);
const validatorUrl = new URL(
  "../templates/handover-skill/validate.mjs",
  import.meta.url,
);

test("publishes a local-first handoff entry skill", async () => {
  const source = await readFile(skillUrl, "utf8");

  for (const heading of [
    "# Hand off work that another actor can continue",
    "## Choose create or resume",
    "## Inspect the source of truth",
    "## Create the local record",
    "## Verify the local handoff",
    "## Publish through Handover when available",
    "## Resume a handoff",
  ]) {
    assert.match(source, new RegExp(`^${heading}$`, "m"));
  }

  for (const section of [
    "## Goal",
    "## Current state",
    "## Decisions",
    "## Evidence",
    "## Next action",
    "## Open risks and questions",
    "## Relevant artifacts",
  ]) {
    assert.match(source, new RegExp(section));
  }

  assert.match(source, /This skill works locally/);
  assert.match(source, /handover-record/);
  assert.match(source, /utm_campaign=handoff_skill/);
  assert.match(source, /Keep visibility private/);
  assert.match(source, /access is denied/);
  assert.doesNotMatch(source, /hnd_tok_[A-Za-z0-9]+/);

  const validation = spawnSync(
    process.execPath,
    [validatorUrl.pathname, skillUrl.pathname, "--json"],
    { encoding: "utf8" },
  );
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  const result = JSON.parse(validation.stdout);
  assert.equal(result.valid, true);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.checks.every((check) => check.passed), true);
});
