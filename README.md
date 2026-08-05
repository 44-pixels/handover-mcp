# Handover MCP

Move active work between Claude Code, Codex, Cursor, Gemini CLI, people, and
service agents without losing decisions, files, history, or authorship.

[![npm CLI](https://img.shields.io/npm/v/handover-sh?label=handover-sh&logo=npm)](https://www.npmjs.com/package/handover-sh)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-verified-2684ff)](https://registry.modelcontextprotocol.io/v0.1/servers?search=sh.handover%2Fhandover)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-7-84cc16)](https://skills.handover.sh/?utm_source=github&utm_medium=referral&utm_campaign=agent_skills_launch)
[![skills.sh](https://skills.sh/b/44-pixels/handover-mcp)](https://www.skills.sh/44-pixels/handover-mcp)
[![MIT License](https://img.shields.io/badge/license-MIT-111111)](LICENSE)

[Handover](https://handover.sh/?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
provides shared, versioned context for humans and AI agents through a hosted
Model Context Protocol server, a dependency-free CLI, and seven open Agent
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
- [Continue the demo in your workspace](https://handover.sh/app?start=demo&utm_source=github&utm_medium=referral&utm_campaign=public_continuation_demo)
- [Demo workflow and verification notes](DEMO.md)
- [Agent-readable manifest](https://handover.sh/demo.json)
- [Raw Markdown](https://handover.sh/demo/context.md)
- [Raw SQL](https://handover.sh/demo/inventory.sql)
- [Evidence JSON](https://handover.sh/demo/evidence.json)

## Build a private handoff prompt

The [AI handoff prompt
generator](https://handover.sh/tools/ai-handoff-prompt-generator?utm_source=github&utm_medium=referral&utm_campaign=ai_handoff_prompt)
turns unfinished work into separate capture and receiver prompts without
requiring an account. Draft fields stay inside the browser tab and are not sent
to analytics or stored as a server-side draft.

The receiver prompt requires the next actor to inspect the evidence, separate
verified and unverified state, identify blockers, and state one bounded next
action before continuing. Copy or download the Markdown record, or carry the
same private draft into a prefilled first handover.

- [Open the private prompt generator](https://handover.sh/tools/ai-handoff-prompt-generator?utm_source=github&utm_medium=referral&utm_campaign=ai_handoff_prompt)
- [Inspect the raw Markdown example](https://handover.sh/examples/ai-handoff-prompt.md)
- [Decide when `HANDOFF.md` is enough](https://handover.sh/guides/handover-vs-handoff-md?utm_source=github&utm_medium=referral&utm_campaign=ai_handoff_prompt)

## Move from Claude Code to Codex

Codex's built-in import is the right first choice for a one-time move of
supported Claude Code setup, projects, memories, and recent chats. Use
Handover when Claude Code and Codex will alternate on unfinished work and need
shared artifacts, separate identities, review, and revision history.

The [Claude Code to Codex transfer
recipe](examples/claude-code-to-codex-context-transfer.md) contains the exact
sender checkpoint, two-host service-credential setup, receiver verification,
optimistic-concurrency continuation, revocation test, and pass criteria. The
[rendered
guide](https://handover.sh/guides/transfer-context-from-claude-code-to-codex?utm_source=github&utm_medium=referral&utm_campaign=claude_code_to_codex)
explains when to use native import and when to use a durable handoff.

## Run the reviewed MCP handoff

The demo shows the finished record. The
[end-to-end MCP handoff procedure](examples/end-to-end-mcp-handoff-workflow.md)
tests the workflow itself across separate authenticated identities:

1. verify the publisher;
2. publish Markdown, SQL, and JSON;
3. read every artifact back;
4. review exact evidence from another identity;
5. publish a correction with optimistic concurrency;
6. resolve the finding against the correcting revision; and
7. prove a fresh successor can continue without the original chat.

It also exercises denied, read-only, stale-revision, and revoked-credential
paths. Use the [rendered
guide](https://handover.sh/guides/end-to-end-mcp-agent-handoff?utm_source=github&utm_medium=referral&utm_campaign=mcp_handoff_e2e)
for the rationale, or connect an agent through the
[install flow](https://handover.sh/install?utm_source=github&utm_medium=referral&utm_campaign=mcp_handoff_e2e)
before running the repository procedure.

## Use the AI agent handoff checklist

For a smaller local handoff, start with the
[Markdown checklist](templates/agent-handoff.md). It captures the objective,
current state, decisions, evidence, constraints, next action, and ownership,
then requires the receiving actor to read the current revision, open the
evidence, reproduce one meaningful result, and mark the handoff as passed or
blocked.

The [rendered checklist and
FAQ](https://handover.sh/templates/agent-handoff?utm_source=github&utm_medium=referral&utm_campaign=agent_handoff_checklist)
explains each verification step. The raw template works without Handover; use
the hosted service when multiple actors need authenticated access, immutable
revisions, search, annotations, or auditable ownership.

## Test company AI context readiness

Before connecting company knowledge to several people and agents, use the
[company AI context readiness checklist](templates/company-ai-context-readiness.md).
It separates approved source knowledge from changing continuation records,
inventories human and service identities, declares company and workspace
boundaries, and finishes with a two-person, two-agent pilot.

The pilot is intentionally stricter than an import count: it verifies
authorized retrieval, attributable revisions, human review, denied searches,
agent revocation, and fresh-session continuation. The
[source-linked architecture
guide](https://handover.sh/guides/shared-workspace-for-humans-and-ai-agents?utm_source=github&utm_medium=referral&utm_campaign=company_ai_knowledge)
explains why a search index, private model memory, and canonical company
records have different responsibilities.

## Use the open handoff format

The [Handoff Continuity
Record](https://handover.sh/protocol?utm_source=github&utm_medium=referral&utm_campaign=handoff_continuity_record)
is a platform-neutral JSON format for the state another human or AI agent needs
to verify and continue work. It records the objective, verified and unverified
state, decisions, evidence, constraints, next action, ownership, and open
review without prescribing transport, routing, authentication, or storage.

The [`protocol/v1/`](protocol/v1/) directory contains:

- a JSON Schema Draft 2020-12 contract;
- a valid inventory-reporting example;
- a dependency-free Node.js conformance checker; and
- producer, receiver, scope, and security requirements.

```bash
node protocol/v1/validate.mjs protocol/v1/example.json
```

MCP can expose the tools used to read and write the record. A2A or an
orchestration framework can route it. Git or Handover can store it.

## Connect

The canonical Streamable HTTP endpoint is:

```text
https://handover.sh/api/mcp?profile=core
```

The recommended core profile exposes 17 tools for everyday identity, search,
retrieval, review, continuation, publishing, and portability workflows. Use
`https://handover.sh/api/mcp?profile=native` for all 27 first-party Handover
operations. The unparameterized `https://handover.sh/api/mcp` endpoint retains
all 55 tools and Reporter aliases for existing integrations.

The endpoint exposes its MCP handshake and tool schemas without an account so
clients and directories can verify compatibility before connecting. Tool calls
remain protected and return Handover's OAuth resource challenge when no valid
human or service credential is present.

Interactive MCP hosts use Handover's first-party OAuth flow: standard discovery,
dynamic client registration, PKCE, short-lived access tokens, and rotating
refresh tokens. The host opens Handover in a browser; sign in as yourself,
review the requested permissions, and approve the connection. Handover records
your human identity on every attributable action.

Unattended runners and hosts without OAuth support use a separately named,
scoped service credential created under **Workspace or Company -> Agents**.
Human and service identities remain independently attributable and revocable.

For the complete setup, identity check, two-agent continuity test, and
troubleshooting flow, see [CONNECTING.md](CONNECTING.md).

### Codex

```bash
codex mcp add handover --url https://handover.sh/api/mcp?profile=core
codex mcp login handover
```

### Claude Code

```bash
claude mcp add --transport http --scope user \
  handover https://handover.sh/api/mcp?profile=core
```

### Gemini CLI

```bash
gemini mcp add --transport http --scope user \
  handover https://handover.sh/api/mcp?profile=core
```

### Cursor

Add this to `.cursor/mcp.json`. Cursor discovers Handover's authorization
server and prompts for browser sign-in when the connection starts:

```json
{
  "mcpServers": {
    "handover": {
      "url": "https://handover.sh/api/mcp?profile=core"
    }
  }
}
```

### Cline

Open Cline's MCP wizard:

```bash
cline mcp install handover --transport http https://handover.sh/api/mcp?profile=core
```

Choose **Remote (HTTP)** and **Static headers**, then enter the scoped service
agent credential in Cline's private header prompt. The agent-readable
[`llms-install.md`](llms-install.md) includes the exact configuration, identity
check, safe first write, two-agent continuation test, and revocation procedure.
Use the [first-party Cline setup
page](https://handover.sh/install?utm_source=cline&utm_medium=marketplace&utm_campaign=cline_marketplace)
for the complete Handover flow. Do not paste a real credential into chat or
commit Cline's private MCP settings.

## Command-line client

The dependency-free Handover CLI supports the same durable workflow from a
terminal:

```bash
npm install --global handover-sh
handover login
handover doctor
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

`handover doctor` is a read-only connection check. It verifies the configured
endpoint, server-resolved identity, workspace, role, scopes, and one protected
context request without printing the credential or changing a handover. Use
the [complete verification checklist](https://handover.sh/guides/test-mcp-server-connection-cli?utm_source=github&utm_medium=referral&utm_campaign=cli_doctor)
before an agent's first write.

## Agent Skills

Install reusable Handover workflows into a compatible coding agent with the
open Agent Skills format:

[![skills.sh](https://skills.sh/b/44-pixels/handover-mcp)](https://skills.sh/44-pixels/handover-mcp)

```bash
npx skills add 44-pixels/handover-mcp --list
npx skills add 44-pixels/handover-mcp --skill handover-record
npx skills add 44-pixels/handover-mcp --skill handover-publish
npx skills add 44-pixels/handover-mcp --skill handover-test-continuity
```

The public collection includes skills for creating and validating portable
handoff records, verifying connections, publishing context, resuming work,
reviewing revision-anchored feedback, testing complete multi-identity
continuity, and governing agent access. Browse the
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

For host-specific installation, use the tested [Claude Code, Codex, Cursor,
and Gemini CLI
guide](https://handover.sh/guides/install-agent-skills-claude-code-codex-cursor-gemini?utm_source=github&utm_medium=referral&utm_campaign=cross_host_skills).
Its [raw verification
checklist](https://handover.sh/examples/cross-host-agent-skill-install.md?utm_source=github&utm_medium=referral&utm_campaign=cross_host_skills)
separates file installation from host discovery, skill activation,
authenticated MCP identity, read-back, denied access, and cross-host
continuation.

To publish a workflow that uses Handover, start with the
[Agent Skill developer
kit](https://skills.handover.sh/publish?utm_source=github&utm_medium=referral&utm_campaign=agent_skill_mcp_builder),
the [contributor contract](CONTRIBUTING.md), and the
[starter skill](templates/handover-skill/SKILL.template.md). Copy the starter
into a new `skills/<name>/SKILL.md`; the template deliberately does not use the
reserved filename so registries cannot mistake it for an installable skill.
Community submissions keep
their publisher and source attribution; catalog inclusion does not widen
Handover access or replace source review.

Validate the local contract before testing the authenticated workflow:

```bash
node templates/handover-skill/validate.mjs skills/<name>/SKILL.md
```

Passing this validator proves the file contract, not host discovery, MCP
authentication, permissions, read-back, or denied behavior. The developer kit
keeps those runtime checks explicit.

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
bodies. Reuse the published
[`CITATION.cff`](benchmark/v1/CITATION.cff),
[`citation.bib`](benchmark/v1/citation.bib), or flat
[`summary.csv`](benchmark/v1/results/2026-08-04/summary.csv) instead of
transcribing values from the page.

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
preserves the intended identity as author, and immediately stops working after
the OAuth grant or service credential is revoked.

## Service agents

Workspace owners create service agents in Handover and grant only the scopes
that actor needs. Store the credential in `HANDOVER_TOKEN`; do not put it in a
repository or MCP configuration committed to source control.

```bash
export HANDOVER_TOKEN='hnd_tok_...'
codex mcp add handover \
  --url https://handover.sh/api/mcp?profile=core \
  --bearer-token-env-var HANDOVER_TOKEN
```

## Discovery and documentation

- [No-login continuation demo](https://handover.sh/demo?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch_demo)
- [AI agent handoff checklist](templates/agent-handoff.md)
- [Company AI context readiness checklist](templates/company-ai-context-readiness.md)
- [Shared knowledge base architecture guide](https://handover.sh/guides/shared-workspace-for-humans-and-ai-agents?utm_source=github&utm_medium=referral&utm_campaign=company_ai_knowledge)
- [End-to-end reviewed MCP handoff](examples/end-to-end-mcp-handoff-workflow.md)
- [Rendered MCP handoff guide](https://handover.sh/guides/end-to-end-mcp-agent-handoff?utm_source=github&utm_medium=referral&utm_campaign=mcp_handoff_e2e)
- [Install and host-specific setup](https://handover.sh/install?utm_source=github&utm_medium=referral&utm_campaign=mcp_launch)
- [MCP memory setup for Claude Code, Cursor, and Codex](https://handover.sh/guides/mcp-memory-server-for-claude-code-cursor-codex?utm_source=github&utm_medium=referral&utm_campaign=mcp_memory_setup)
- [Raw cross-host setup and continuity test](https://handover.sh/examples/mcp-memory-server-setup.md?utm_source=github&utm_medium=referral&utm_campaign=mcp_memory_setup)
- [Claude Code to Codex context transfer](examples/claude-code-to-codex-context-transfer.md)
- [Rendered Claude Code to Codex guide](https://handover.sh/guides/transfer-context-from-claude-code-to-codex?utm_source=github&utm_medium=referral&utm_campaign=claude_code_to_codex)
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
