# Handover MCP

[Handover](https://handover.sh) is shared, versioned context for humans and AI
agents. This repository is the public discovery and connection record for
Handover's hosted Model Context Protocol server.

![Handover product interface](https://handover.sh/og.png)

## Connect

The canonical Streamable HTTP endpoint is:

```text
https://handover.sh/api/mcp
```

People authenticate interactively with Google OAuth. Unattended agents use a
named, scoped service credential created by a Handover workspace owner.

### Codex

```bash
codex mcp add handover --url https://handover.sh/api/mcp
codex mcp login handover --scopes openid,email,profile
```

### Claude Code

```bash
claude mcp add --transport http --scope user handover https://handover.sh/api/mcp
claude mcp login handover
```

### Gemini CLI

```bash
gemini mcp add --transport http --scope user handover https://handover.sh/api/mcp
```

Then run `/mcp auth handover`.

### Cursor

Add this to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "handover": {
      "url": "https://handover.sh/api/mcp"
    }
  }
}
```

## What agents can do

Connected agents can:

- search company or personal context;
- inspect an exact immutable revision;
- read attached Markdown, HTML, SQL, JSON, code, images, and other files;
- retrieve discussions and revision-anchored annotations;
- create a new handover or continue an existing one;
- add, edit, resolve, and respond to review comments;
- preserve the authenticated human or service identity in the audit history.

The server never asks an agent to provide an author identity in tool input.
Authorship comes from the authenticated credential.

## Service agents

Workspace owners create service agents in Handover and grant only the scopes
that actor needs. Store the credential in `HANDOVER_TOKEN`; do not put it in a
repository or MCP configuration committed to source control.

```bash
export HANDOVER_TOKEN='hnd_tok_...'
codex mcp add handover \
  --url https://handover.sh/api/mcp \
  --bearer-token-env-var HANDOVER_TOKEN
```

## Discovery and documentation

- [Install and host-specific setup](https://handover.sh/install)
- [MCP workflow guide](https://handover.sh/guides/mcp-workflow-for-multi-agent-collaboration)
- [Machine-readable host recipes](https://handover.sh/recipes/mcp-hosts.json)
- [MCP server manifest](https://handover.sh/.well-known/mcp.json)
- [Agent tool manifest](https://handover.sh/agent-tools.json)
- [OpenAPI document](https://handover.sh/openapi.json)
- [Agent-readable knowledge corpus](https://handover.sh/llms-full.txt)
- [Security model](https://handover.sh/security)

## Source and support

The Handover application source is maintained in a private repository. This
public repository intentionally contains connection metadata and documentation,
not the hosted service implementation.

Report connection or documentation problems through
[GitHub Issues](https://github.com/44-pixels/handover-mcp/issues). Report
security concerns using the process in [SECURITY.md](SECURITY.md).

