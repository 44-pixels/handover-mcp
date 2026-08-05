import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishes tracked, inspectable paths from GitHub and npm to a first handover", async () => {
  const [demo, readme, cliReadme, cliPackage] = await Promise.all([
    readFile(new URL("../DEMO.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../cli/README.md", import.meta.url), "utf8"),
    readFile(new URL("../cli/package.json", import.meta.url), "utf8"),
  ]);

  assert.match(demo, /## Inspect the record/);
  assert.match(demo, /## Continue it yourself/);
  assert.match(demo, /## Continue it with an agent/);
  assert.match(
    demo,
    /Following the link alone never creates\s+private context/,
  );
  assert.match(demo, /\/app\?start=demo/);
  assert.match(demo, /utm_source=github&utm_medium=release/);
  assert.match(demo, /public_continuation_demo/);
  assert.match(demo, /end-to-end-mcp-handoff-workflow\.md/);
  assert.match(readme, /Continue the demo in your workspace/);
  assert.match(readme, /\(DEMO\.md\)/);
  assert.match(readme, /Build a private handoff prompt/);
  assert.match(readme, /utm_source=github&utm_medium=referral&utm_campaign=ai_handoff_prompt/);
  assert.match(readme, /examples\/ai-handoff-prompt\.md/);
  assert.match(cliReadme, /private AI\s+handoff prompt\s+generator/);
  assert.match(cliReadme, /utm_source=npm&utm_medium=registry&utm_campaign=ai_handoff_prompt/);
  assert.equal(JSON.parse(cliPackage).version, "0.1.4");
});
