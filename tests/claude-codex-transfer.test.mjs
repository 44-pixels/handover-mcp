import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const recipeFile = new URL(
  "../examples/claude-code-to-codex-context-transfer.md",
  import.meta.url,
);

test("publishes an accurate and discoverable Claude Code to Codex transfer", async () => {
  const [recipe, readme, examples] = await Promise.all([
    readFile(recipeFile, "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../examples/README.md", import.meta.url), "utf8"),
  ]);

  assert.match(recipe, /## Choose the transfer path/);
  assert.match(recipe, /Settings > Import/);
  assert.match(recipe, /## Sender checkpoint in Claude Code/);
  assert.match(recipe, /## Receiver verification in Codex/);
  assert.match(recipe, /expectedRevisionId/);
  assert.match(recipe, /## Pass criteria/);
  assert.match(recipe, /does not currently expose first-party dynamic OAuth/);
  assert.match(recipe, /Authorization: Bearer \$HANDOVER_CLAUDE_TOKEN/);
  assert.match(recipe, /--bearer-token-env-var HANDOVER_CODEX_TOKEN/);
  assert.match(recipe, /https:\/\/learn\.chatgpt\.com\/docs\/import\.md/);
  assert.match(recipe, /https:\/\/code\.claude\.com\/docs\/en\/mcp/);
  assert.doesNotMatch(recipe, /codex mcp login handover/);
  assert.doesNotMatch(recipe, /hnd_tok_[A-Za-z0-9_-]{12,}/);

  assert.match(readme, /## Move from Claude Code to Codex/);
  assert.match(readme, /examples\/claude-code-to-codex-context-transfer\.md/);
  assert.match(
    readme,
    /utm_source=github&utm_medium=referral&utm_campaign=claude_code_to_codex/,
  );
  assert.match(examples, /## Claude Code to Codex context transfer/);
});
