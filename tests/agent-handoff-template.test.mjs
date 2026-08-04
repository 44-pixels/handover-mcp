import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishes a receiver-verifiable AI agent handoff template", async () => {
  const [template, readme, recordSkill] = await Promise.all([
    readFile(new URL("../templates/agent-handoff.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(
      new URL("../skills/handover-record/SKILL.md", import.meta.url),
      "utf8",
    ),
  ]);

  for (const heading of [
    "## Handoff checklist",
    "## Objective",
    "## Current state",
    "## Decisions",
    "## Evidence",
    "## Constraints",
    "## Next action",
    "## Ownership",
    "## Receiver verification",
    "## Handoff result",
  ]) {
    assert.match(template, new RegExp(`^${heading}$`, "m"));
  }

  assert.match(template, /One meaningful claim or result was reproduced/);
  assert.match(template, /Status:\*\* Pass \/ Blocked/);
  assert.doesNotMatch(template, /hnd_tok_[A-Za-z0-9]+/);
  assert.match(readme, /Use the AI agent handoff checklist/);
  assert.match(readme, /utm_campaign=agent_handoff_checklist/);
  assert.match(recordSkill, /templates\/agent-handoff\.md/);
  assert.match(recordSkill, /utm_campaign=agent_handoff_checklist/);
});
