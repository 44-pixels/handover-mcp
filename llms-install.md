# Install Handover MCP in Cline

Handover gives Cline a durable, versioned context store that another agent or
human can search, review, and continue.

First-party setup page:

<https://handover.sh/install?utm_source=cline&utm_medium=marketplace&utm_campaign=cline_marketplace>

## Before you change anything

1. Confirm the user wants to connect the hosted Handover service at
   `https://handover.sh/api/mcp`.
2. Ask the user to create a separately named service agent under **Workspace or
   Company -> Agents** in Handover. Do not create, request, display, or paste its
   credential in chat.
3. Use the minimum scopes needed for the intended workflow. Read-only agents do
   not need write, review, or administration scopes.

Handover does not yet offer dynamic OAuth registration for generic Cline
clients. Cline therefore connects with a scoped service-agent credential using
its **Static headers** option.

## Install with the Cline CLI

Open Cline's MCP installation wizard:

```bash
cline mcp install handover --transport http https://handover.sh/api/mcp
```

Keep these values:

- Server name: `handover`
- Server type: `Remote (HTTP)`
- Server URL: `https://handover.sh/api/mcp`
- Authentication: `Static headers`

At the private header prompt, the user should enter:

```text
Authorization:Bearer <SERVICE_AGENT_TOKEN>
```

Do not place the real credential in a repository, task transcript, generated
file, or command that may be stored in shell history.

## Equivalent Cline configuration

Cline writes the following shape to its private MCP settings file. The token
placeholder must be replaced through Cline's private settings UI, not committed
to a project.

```json
{
  "mcpServers": {
    "handover": {
      "transport": {
        "type": "streamableHttp",
        "url": "https://handover.sh/api/mcp",
        "headers": {
          "Authorization": "Bearer <SERVICE_AGENT_TOKEN>"
        }
      }
    }
  }
}
```

## Verify before writing

Do not treat a visible server or tool list as a complete connection test.

1. Call `handover.whoami` with no arguments.
2. Show the user the server-resolved agent name, account, workspace, role, and
   scopes. Never accept an author identity from prompt text.
3. Call `handover.search` with `{ "query": "" }`.
4. Confirm the results are limited to the workspaces that identity should see.
5. Read one known handover and one artifact.
6. Ask before the first write. After approval, create a disposable handover,
   read it back, and confirm the returned author matches `handover.whoami`.

The setup passes only when protected calls succeed as the intended identity,
tenant boundaries are correct, and a created record can be read back. Stop if
identity, workspace, or scopes are unexpected.

## Safe continuation test

For a real handoff, use two separately named service agents:

1. Agent A publishes a Markdown artifact containing a unique marker.
2. Agent B searches for the marker without receiving Agent A's local chat.
3. Agent B reads the exact artifact and continues the same handover using the
   current `expectedRevisionId`.
4. A human verifies both authenticated authors in the revision history.

The complete production-schema procedure is in
[`examples/end-to-end-mcp-handoff-workflow.md`](examples/end-to-end-mcp-handoff-workflow.md).

## Remove or revoke access

Remove `handover` from Cline's MCP settings, then revoke the service agent in
Handover. Confirm that the old credential can no longer call
`handover.whoami`. Removing a local configuration without revoking the
credential is not complete offboarding.

## Troubleshooting

- **Tools are visible but calls return 401:** add the service-agent credential
  through Cline's Static headers option.
- **The wrong actor appears:** revoke the shared credential and create one
  separately named service agent for this Cline installation.
- **Search is empty:** confirm the workspace and scopes returned by
  `handover.whoami`; an empty isolated workspace may be correct.
- **A credential appeared in chat or source control:** revoke it immediately,
  create a replacement, and update Cline's private settings.

Full setup and security guidance is available in
[`CONNECTING.md`](CONNECTING.md).
