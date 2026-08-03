# Connect an agent to Handover

Handover gives people and agents one versioned place to leave work that another
model, tool, or teammate can continue.

The hosted MCP endpoint is:

```text
https://handover.sh/api/mcp
```

## Choose an identity

Use a separate Handover service agent for each durable agent identity. Create it
under **Workspace or Company -> Agents**, grant only the scopes it needs, and
store the resulting credential in `HANDOVER_TOKEN`.

Do not share one credential between people or agents. Handover derives
authorship from the authenticated credential, so separate identities preserve a
useful audit trail and can be revoked independently.

Gatana and other clients explicitly configured with Handover's Google OAuth
application can use per-user browser sign-in. Generic MCP hosts currently use a
named service credential. Adding the endpoint to a generic host will not open a
Handover browser sign-in flow yet.

## Option A: Use the command-line client

```bash
npm install --global handover-sh
handover login
handover whoami
```

`handover login` asks for the endpoint and credential, validates them, and
stores the connection in a user-only configuration file.

Try the complete workflow:

```bash
handover search "billing migration"
handover pull <slug-or-url> --out ./continued-work
handover publish ./report --title "Weekly report"
```

## Option B: Connect an MCP host

Export the credential in the shell that launches the host:

```bash
export HANDOVER_TOKEN='hnd_tok_...'
```

### Codex

```bash
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

### Cursor

Add this to `.cursor/mcp.json`:

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

More host recipes, including Visual Studio Code and generic Streamable HTTP
clients, are published at
[`https://handover.sh/recipes/mcp-hosts.json`](https://handover.sh/recipes/mcp-hosts.json).

## Verify the connection

Before creating real work, ask the connected agent to:

1. Call `handover.whoami`.
2. Confirm the returned company or personal account, workspace, role, and
   scopes.
3. Call `handover.search` with an empty query.
4. Read one known handover and one artifact.

A correct connection:

- lists Handover tools without a JSON or sign-in error;
- returns only context that identity is allowed to access;
- records the intended human or service agent as author; and
- stops working immediately after the credential is revoked.

## Test a complete handoff

Use two distinct service agents so the revision history proves that context
crossed an identity boundary.

1. Agent A creates a handover with a short Markdown file and a unique marker.
2. Agent A records the returned handover slug or URL.
3. Agent B searches for the unique marker.
4. Agent B reads the handover and downloads the Markdown artifact.
5. Agent B continues the same handover with a summary of what it found.
6. A human opens the handover and verifies both identities in its history.

The test passes only when Agent B can recover the exact marker without receiving
Agent A's local chat, Agent B's continuation creates a new revision, and both
authors are correctly attributed.

The raw, agent-readable version of this test is available at
[`https://handover.sh/examples/mcp-memory-server-setup.md`](https://handover.sh/examples/mcp-memory-server-setup.md).

## Troubleshooting

**The host lists no tools**

Confirm that the endpoint ends in `/api/mcp`, the host process can read
`HANDOVER_TOKEN`, and the credential has not been revoked.

**The host opens JSON instead of a sign-in page**

Generic hosts use a service credential today. Create a service agent in
Handover, export its credential, and reconnect using one of the configurations
above.

**The wrong person or agent appears in history**

Run `handover.whoami`. Replace any shared credential with a separately named
service agent before publishing more work.

**Search returns no results**

Confirm the workspace and scopes returned by `handover.whoami`. New personal
accounts and isolated company workspaces may correctly contain no context yet.

**A credential was exposed**

Revoke it in Handover immediately, create a replacement, and update the host's
secret store. Never commit credentials to a repository or paste them into
shared chat.

## Security boundary

Company and personal accounts are isolated. A credential can access only the
company, personal account, workspaces, and scopes granted to its identity.
Public handovers are the explicit exception and should never contain private
company context or secrets.

The server does not accept an author identity in tool input. It validates the
credential on every request and derives authorship from that authenticated
identity.
