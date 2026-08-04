import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const installFile = new URL("../llms-install.md", import.meta.url);

test("publishes a complete and safe Cline installation contract", async () => {
  const content = await readFile(installFile, "utf8");

  assert.match(
    content,
    /cline mcp install handover --transport http https:\/\/handover\.sh\/api\/mcp/,
  );
  assert.match(content, /Authentication: `Static headers`/);
  assert.match(content, /handover\.whoami/);
  assert.match(content, /handover\.search/);
  assert.match(content, /expectedRevisionId/);
  assert.match(content, /revoke the service agent/i);
  assert.match(
    content,
    /utm_source=cline&utm_medium=marketplace&utm_campaign=cline_marketplace/,
  );
  assert.doesNotMatch(content, /hnd_tok_[A-Za-z0-9_-]{12,}/);

  const configuration = JSON.parse(
    content.match(/```json\n([\s\S]+?)\n```/)?.[1] ?? "",
  );
  assert.deepEqual(configuration, {
    mcpServers: {
      handover: {
        transport: {
          type: "streamableHttp",
          url: "https://handover.sh/api/mcp?profile=core",
          headers: {
            Authorization: "Bearer <SERVICE_AGENT_TOKEN>",
          },
        },
      },
    },
  });
});
