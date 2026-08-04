import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishes a tracked, inspectable path from GitHub to a first handover", async () => {
  const [demo, readme] = await Promise.all([
    readFile(new URL("../DEMO.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
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
});
