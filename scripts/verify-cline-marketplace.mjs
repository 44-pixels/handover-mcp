#!/usr/bin/env node

const endpoint = "https://handover.sh/api/mcp";
const protocolVersion = "2025-06-18";
const requiredTools = [
  "handover.whoami",
  "handover.search",
  "handover.get",
  "handover.read_artifact",
  "handover.create",
  "handover.continue",
];

const initialize = await rpc("initialize", {
  protocolVersion,
  capabilities: {},
  clientInfo: {
    name: "cline-marketplace-validation",
    version: "1.0.0",
  },
});
assert(initialize.response.status === 200, "Initialize must return HTTP 200.");
assert(
  initialize.body?.result?.protocolVersion === protocolVersion,
  "Initialize must negotiate the expected MCP protocol version.",
);
assert(
  initialize.body?.result?.serverInfo?.name === "handover",
  "Initialize must identify the Handover server.",
);

const tools = await rpc("tools/list", {});
assert(tools.response.status === 200, "tools/list must return HTTP 200.");
const toolNames = new Set(
  (tools.body?.result?.tools ?? []).map((tool) => tool.name),
);
for (const name of requiredTools) {
  assert(toolNames.has(name), `tools/list is missing ${name}.`);
}

const protectedCall = await rpc("tools/call", {
  name: "handover.whoami",
  arguments: {},
});
assert(
  protectedCall.response.status === 401,
  "An unauthenticated protected call must return HTTP 401.",
);
assert(
  protectedCall.response.headers
    .get("www-authenticate")
    ?.includes("/.well-known/oauth-protected-resource"),
  "The 401 response must advertise OAuth protected-resource metadata.",
);
assert(
  protectedCall.body?.error?.code === "authentication_required",
  "The 401 response must identify authentication_required.",
);

console.log(
  JSON.stringify(
    {
      endpoint,
      protocolVersion,
      server: initialize.body.result.serverInfo,
      tools: toolNames.size,
      requiredTools,
      unauthenticatedProtectedCall: {
        status: protectedCall.response.status,
        code: protectedCall.body.error.code,
        challenge: "valid",
      },
    },
    null,
    2,
  ),
);

async function rpc(method, params) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": protocolVersion,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${method}-${crypto.randomUUID()}`,
      method,
      params,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
