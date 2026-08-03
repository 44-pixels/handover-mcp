# Handover MCP

Move active work between Claude Code, Codex, Cursor, Gemini CLI, people, and
service agents without losing decisions, files, history, or authorship.

[![npm CLI](https://img.shields.io/npm/v/handover-sh?label=handover-sh&logo=npm)](https://www.npmjs.com/package/handover-sh)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-verified-2684ff)](https://registry.modelcontextprotocol.io/v0.1/servers?search=sh.handover%2Fhandover)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-4-84cc16)](https://skills.handover.sh/?utm_source=github&utm_medium=referral&utm_campaign=agent_skills_launch)
[![MIT License](https://img.shields.io/badge/license-MIT-111111)](LICENSE)

[Handover](https://handover.sh/?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
provides shared, versioned context for humans and AI agents through a hosted
Model Context Protocol server, a dependency-free CLI, and four open Agent
Skills. This repository is the public source, discovery, installation, and
connection record for those interfaces.

![Handover product interface](https://handover.sh/og.png)

## See a complete handoff

The [public continuation
demo](https://handover.sh/demo?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch_demo)
shows the same workflow from both sides: an interactive human view and an
agent-readable record. It includes Markdown, SQL, JSON, a visual artifact,
three attributable revisions, a human review note, and the next agent's
resolution. No account is required.

- [Interactive demo](https://handover.sh/demo?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch_demo)
- [Agent-readable manifest](https://handover.sh/demo.json)
- [Raw Markdown](https://handover.sh/demo/context.md)
- [Raw SQL](https://handover.sh/demo/inventory.sql)
- [Evidence JSON](https://handover.sh/demo/evidence.json)

## Connect

The canonical Streamable HTTP endpoint is:

```text
https://handover.sh/api/mcp
```

The endpoint exposes its MCP handshake and tool schemas without an account so
clients and directories can verify compatibility before connecting. Tool calls
remain protected and return Handover's OAuth resource challenge when no valid
human or service credential is present.

Use a named, scoped service credential created by a Handover workspace owner
with generic MCP hosts. Gatana and other explicitly configured clients can use
per-user Google OAuth. Handover does not yet expose first-party dynamic OAuth
registration for arbitrary MCP clients.

Configured interactive clients open Handover's sign-in flow in a browser. Sign
in with your own Google account and the client records your human identity.
Generic hosts use the named service agent supplied in their configuration and
do not open a human sign-in page.

For the complete setup, identity check, two-agent continuity test, and
troubleshooting flow, see [CONNECTING.md](CONNECTING.md).

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

The published package source and metadata live in [`cli/`](cli/). The audited
direct installer remains available when npm is not appropriate:

```bash
curl -fsSL https://handover.sh/install.sh | sh
```

Package releases are built from this public repository. The bootstrap and
trusted-publishing process is documented in [RELEASING.md](RELEASING.md).

## Agent Skills

Install reusable Handover workflows into a compatible coding agent with the
open Agent Skills format:

[![skills.sh](https://skills.sh/b/44-pixels/handover-mcp)](https://skills.sh/44-pixels/handover-mcp)

```bash
npx skills add 44-pixels/handover-mcp --list
npx skills add 44-pixels/handover-mcp --skill handover-publish
```

The public collection includes skills for publishing context, resuming work,
reviewing revision-anchored feedback, and governing agent access. Browse the
catalog at [skills.handover.sh](https://skills.handover.sh/) or inspect the
source in [`skills/`](skills/). The collection is also indexed in the
[Skills.sh directory](https://www.skills.sh/44-pixels/handover-mcp).
The catalog organizes skills by handoff phase, includes a plain-language
starting request for each workflow, and exposes the exact MCP tools and CLI
commands through its [machine-readable
index](https://skills.handover.sh/index.json).

The runtime is independently listed as
[`sh.handover/handover` in the official MCP
Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=sh.handover%2Fhandover).

The [Agent Skills and MCP
guide](https://handover.sh/guides/agent-skills-and-mcp?utm_source=github&utm_medium=referral&utm_campaign=agent_skills_mcp)
explains the boundary between portable workflow instructions and authenticated
runtime capabilities. Its [raw end-to-end
workflow](https://handover.sh/examples/agent-skill-mcp-workflow.md?utm_source=github&utm_medium=referral&utm_campaign=agent_skills_mcp)
is designed for direct agent retrieval.

To publish a workflow that uses Handover, start with the
[contributor contract](CONTRIBUTING.md) and the
[starter skill](templates/handover-skill/SKILL.md). Community submissions keep
their publisher and source attribution; catalog inclusion does not widen
Handover access or replace source review.

## Open continuity benchmark

The [AI Handoff Continuity
Benchmark](https://handover.sh/benchmark?utm_source=github&utm_medium=referral&utm_campaign=continuity_benchmark_results)
tests whether a successor model can recover the objective, current state,
decisions, evidence, constraints, next action, owner, and open questions from
a transcript, compressed memory, or structured handoff.

The first two-system pilot scored structured handoffs at 79.45, conversation
transcripts at 76.67, and compressed memory at 45.00. It is a small authored
pilot rather than a model leaderboard. The public [`benchmark/`](benchmark/)
directory contains the dataset, answer key, dependency-free scorer, strict
submissions, deterministic results, limitations, and all 18 raw response
bodies.

```bash
cd benchmark/v1
node run.mjs --validate-scorer
node run.mjs --prompts ./prompts
```

## What agents can do

Connected agents can:

- verify the active identity, organization, workspace, and scopes with
  `handover.whoami`;
- search company or personal context;
- inspect an exact immutable revision;
- read attached Markdown, HTML, SQL, JSON, code, images, and other files;
- retrieve discussions and revision-anchored annotations;
- create a new handover or continue an existing one;
- add, edit, resolve, and respond to review comments;
- preserve the authenticated human or service identity in the audit history.

The server never asks an agent to provide an author identity in tool input.
Authorship comes from the authenticated credential.

## Verify the connection

Ask the connected host to perform these calls before real work:

1. Call `handover.whoami` with no arguments and confirm the returned person or
   named service agent, organization, workspace, role, and scopes.
2. Call `handover.search` with `{ "query": "" }` and confirm it returns only
   context that identity should be able to access.
3. Read one known handover and artifact before creating or continuing work.

A working connection lists Handover's tools without a JSON or sign-in error,
preserves the intended identity as author, and immediately stops working when
the service credential is revoked.

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

- [No-login continuation demo](https://handover.sh/demo?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch_demo)
- [Install and host-specific setup](https://handover.sh/install?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [MCP memory setup for Claude Code, Cursor, and Codex](https://handover.sh/guides/mcp-memory-server-for-claude-code-cursor-codex?utm_source=github&utm_medium=referral&utm_campaign=mcp_memory_setup)
- [Raw cross-host setup and continuity test](https://handover.sh/examples/mcp-memory-server-setup.md?utm_source=github&utm_medium=referral&utm_campaign=mcp_memory_setup)
- [Connection and verification runbook](CONNECTING.md)
- [MCP workflow guide](https://handover.sh/guides/mcp-workflow-for-multi-agent-collaboration?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [MCP OAuth vs service accounts](https://handover.sh/guides/mcp-oauth-vs-service-accounts?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [Preserve context across AI coding agents](https://handover.sh/guides/preserve-context-across-ai-coding-agents?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [Migrate static report folders](https://handover.sh/guides/migrate-static-report-folders-to-shared-ai-context?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [Glama hosted connector](https://glama.ai/mcp/connectors/sh.handover/handover)
- [Machine-readable host recipes](https://handover.sh/recipes/mcp-hosts.json)
- [MCP server manifest](https://handover.sh/.well-known/mcp.json)
- [Agent tool manifest](https://handover.sh/agent-tools.json)
- [OpenAPI document](https://handover.sh/openapi.json)
- [Agent-readable knowledge corpus](https://handover.sh/llms-full.txt)
- [Security model](https://handover.sh/security?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)

## Source and support

The hosted Handover application source is maintained in a private repository.
This public repository contains the MCP connection record, setup documentation,
and the source of the dependency-free CLI, not the hosted service
implementation.

Report connection or documentation problems through
[GitHub Issues](https://github.com/44-pixels/handover-mcp/issues). Report
security concerns using the process in [SECURITY.md](SECURITY.md).
