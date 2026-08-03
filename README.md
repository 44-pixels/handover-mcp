# Handover MCP

[Handover](https://handover.sh/?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch) is shared, versioned context for humans and AI
agents. This repository is the public discovery and connection record for
Handover's hosted Model Context Protocol server.

![Handover product interface](https://handover.sh/og.png)

## Connect

The canonical Streamable HTTP endpoint is:

```text
https://handover.sh/api/mcp
```

Use a named, scoped service credential created by a Handover workspace owner
with generic MCP hosts. Gatana and other explicitly configured clients can use
per-user Google OAuth. Handover does not yet expose first-party dynamic OAuth
registration for arbitrary MCP clients.

### Codex

```bash
export HANDOVER_TOKEN='hnd_tok_...'
codex mcp add handover \
  --url https://handover.sh/api/mcp \
  --bearer-token-env-var HANDOVER_TOKEN
```

### Claude Code

```bash
claude mcp add --transport http --scope user \
  --header "Authorization: Bearer $HANDOVER_TOKEN" \
  handover https://handover.sh/api/mcp
```

### Gemini CLI

```bash
gemini mcp add --transport http --scope user \
  --header "Authorization: Bearer $HANDOVER_TOKEN" \
  handover https://handover.sh/api/mcp
```

### Cursor

Export `HANDOVER_TOKEN`, then add this to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "handover": {
      "url": "https://handover.sh/api/mcp",
      "headers": {
        "Authorization": "Bearer ${env:HANDOVER_TOKEN}"
      }
    }
  }
}
```

## Command-line client

The dependency-free Handover CLI supports the same durable workflow from a
terminal:

```bash
npm install --global handover-sh
handover login
handover search "billing migration"
handover pull <slug-or-url> --out ./continued-work
handover publish ./report --title "Weekly report"
```

The publishable source and package metadata live in [`cli/`](cli/). Until the
npm release is available, use the audited direct installer:

```bash
curl -fsSL https://handover.sh/install.sh | sh
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

- [Install and host-specific setup](https://handover.sh/install?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [MCP workflow guide](https://handover.sh/guides/mcp-workflow-for-multi-agent-collaboration?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [Machine-readable host recipes](https://handover.sh/recipes/mcp-hosts.json)
- [MCP server manifest](https://handover.sh/.well-known/mcp.json)
- [Agent tool manifest](https://handover.sh/agent-tools.json)
- [OpenAPI document](https://handover.sh/openapi.json)
- [Agent-readable knowledge corpus](https://handover.sh/llms-full.txt)
- [Security model](https://handover.sh/security)

## Source and support

The hosted Handover application source is maintained in a private repository.
This public repository contains the MCP connection record, setup documentation,
and the source of the dependency-free CLI, not the hosted service
implementation.

Report connection or documentation problems through
[GitHub Issues](https://github.com/44-pixels/handover-mcp/issues). Report
security concerns using the process in [SECURITY.md](SECURITY.md).
