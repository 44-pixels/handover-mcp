# Claude Code to Codex context transfer

Use this recipe to move unfinished work from Claude Code to Codex without
copying the original conversation into the receiving session.

## Choose the transfer path

Use Codex's built-in import for a one-time move of supported Claude Code setup,
projects, memories, and recent chats:

1. Open **Settings > Import** in the desktop app, or run `/import` in an idle
   Codex CLI session.
2. Choose **Claude Code**.
3. Select the setup, project files, and recent chats to import.
4. Review permissions, hooks, MCP authentication, and path-dependent commands.
5. Start a fresh Codex task in the imported project.

Use the workflow below when Claude Code and Codex will alternate repeatedly,
when another person or service agent must participate, or when the transfer
needs shared evidence, review, attribution, and revision history.

## Connect both hosts

Endpoint:

```text
https://handover.sh/api/mcp
```

Handover supports per-user Google OAuth in explicitly configured clients such
as Gatana. It does not currently expose first-party dynamic OAuth registration
for arbitrary MCP clients, so generic Claude Code and Codex connections use
separate, named service credentials created under **Company > Agents**.

```sh
# Claude Code
export HANDOVER_CLAUDE_TOKEN='hnd_tok_...'
claude mcp add --transport http --scope user \
  --header "Authorization: Bearer $HANDOVER_CLAUDE_TOKEN" \
  handover https://handover.sh/api/mcp

# Codex
export HANDOVER_CODEX_TOKEN='hnd_tok_...'
codex mcp add handover \
  --url https://handover.sh/api/mcp \
  --bearer-token-env-var HANDOVER_CODEX_TOKEN
```

Do not share one token between hosts, commit either token, or paste a token
into a handover.

## Sender checkpoint in Claude Code

Before publishing:

```sh
git status --short
git diff --stat
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
# Run the smallest relevant test or reproduction command.
```

Create `HANDOFF.md`:

```md
# Continuation record

## Objective
State the outcome and acceptance criteria.

## Current state
List complete, in-progress, blocked, and unverified work.

## Decisions
Record each material choice and why it was made.

## Evidence
Record the commit, changed files, commands, outputs, and source links.

## Constraints
Record permissions, deadlines, safety rules, and known exclusions.

## Next action
Give one bounded command or edit and its expected result.

## Ownership
Name the actor responsible for the next action.
```

Claude Code MCP sequence:

1. Call `handover.whoami` and verify the person or service-agent identity,
   company, workspace, role, and scopes.
2. Call `handover.search` with the task title or a unique marker.
3. Create a new handover only when no canonical record exists. Otherwise,
   continue the current record with its `expectedRevisionId`.
4. Attach `HANDOFF.md`, material test output, and only the source artifacts the
   successor needs.
5. Call `handover.get`, then read every artifact back.
6. Record the handover ID, canonical URL, revision ID, and artifact names.

Do not publish environment files, credentials, private keys, hidden
chain-of-thought, dependency directories, or unrelated personal data.

## Receiver verification in Codex

Start a fresh Codex session. Do not paste the Claude Code conversation.

1. Call `handover.whoami` and verify that Codex resolves to the intended
   receiving identity.
2. Call `handover.search` using the unique marker.
3. Call `handover.get` for the canonical record.
4. Read `HANDOFF.md`, supporting artifacts, and unresolved annotations.
5. Inspect the local repository's applicable `AGENTS.md` files.
6. Compare the declared repository, branch, commit, and worktree with the
   actual checkout.
7. Reproduce one material test result or failure.
8. Perform the bounded next action.
9. Call `handover.continue` with the current `expectedRevisionId`.
10. Call `handover.get` again and verify the new revision and attribution.

## Pass criteria

- Codex finds the handoff without receiving the Claude Code transcript.
- Claude Code and Codex resolve to the intended separate identities.
- Codex states the correct objective, decision, constraint, and next action.
- The attached evidence and declared Git state match the sender's checkpoint.
- Open annotations and assignments remain visible.
- Codex appends a new canonical revision with correct attribution.
- A stale `expectedRevisionId` is rejected.
- Revoking one service credential leaves the other identity working.

## What each layer owns

| Layer | Durable content |
| --- | --- |
| Git | Source code, committed tests, and inspectable history |
| `CLAUDE.md` | Stable Claude Code project instructions |
| `AGENTS.md` | Stable Codex project instructions |
| `HANDOFF.md` | Portable snapshot of the changing task state |
| Handover | Shared revisions, artifacts, identity, review, access, and discovery |

## Primary sources

- OpenAI Codex: [Import from another agent](https://learn.chatgpt.com/docs/import.md)
- OpenAI Codex: [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md.md)
- OpenAI Codex: [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp.md)
- Anthropic: [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- Anthropic: [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
