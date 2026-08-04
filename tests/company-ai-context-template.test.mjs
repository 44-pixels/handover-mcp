import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishes a company AI context readiness record", async () => {
  const [readme, template] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../templates/company-ai-context-readiness.md", import.meta.url), "utf8"),
  ]);

  assert.match(readme, /Test company AI context readiness/);
  assert.match(readme, /templates\/company-ai-context-readiness\.md/);
  assert.match(readme, /utm_campaign=company_ai_knowledge/);
  assert.match(template, /## Approved sources/);
  assert.match(template, /## Identity inventory/);
  assert.match(template, /## Search and retrieval policy/);
  assert.match(template, /## Pilot verification/);
  assert.match(template, /A disabled agent immediately lost read and write access/);
  assert.match(template, /Status:\*\* Pass \/ Blocked/);
});
