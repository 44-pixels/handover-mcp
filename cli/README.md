# Handover CLI

Publish, find, pull, and continue versioned context across Claude Code, Codex,
Cursor, Gemini CLI, people, and service agents.

[Try the public continuation demo](https://handover.sh/demo?utm_source=npm&utm_medium=registry&utm_campaign=cli_launch)
without creating an account. It includes Markdown, SQL, JSON, an image, review
feedback, and attributable revisions.

Need to structure unfinished work before installing anything? The [private AI
handoff prompt
generator](https://handover.sh/tools/ai-handoff-prompt-generator?utm_source=npm&utm_medium=registry&utm_campaign=ai_handoff_prompt)
creates capture and receiver prompts in the browser, keeps draft contents out
of analytics and server-side storage, and can carry the same draft into a
prefilled first handover.

## Quick start

```bash
npm install --global handover-sh
handover login
handover doctor
handover search "billing migration"
handover pull <slug-or-url> --out ./continued-work
```

Create a scoped agent credential in Handover under **Workspace or Company →
Agents**. `handover login` validates the credential and stores it in a
user-only configuration file.

`handover doctor` is read-only. It verifies the endpoint, authenticated
identity, workspace, scopes, and a real context-list request without printing
the credential or changing a handover. The
[complete verification checklist](https://handover.sh/guides/test-mcp-server-connection-cli?utm_source=npm&utm_medium=registry&utm_campaign=cli_doctor)
adds failure classification and a two-identity continuation test.

Publish a file or a complete working folder:

```bash
handover create --title "Research handover" --file ./context.md
handover publish ./report --title "Weekly report"
```

## One context layer

The CLI and Handover MCP use the same context, permissions, and revision
history. A person can publish a folder from the terminal, another agent can
retrieve it through MCP, and the next person can review the resulting
continuation in Handover.

Handover preserves:

- Markdown, HTML, SQL, JSON, code, images, and related assets;
- immutable revisions and the identity behind each change;
- discussions, mentions, and revision-anchored annotations;
- company, workspace, and personal access boundaries.

The credential belongs to one human or named service agent. Every create,
continuation, comment, and annotation remains attributable to that identity.
Keep credentials out of repositories and committed configuration files.

## Reusable Agent Skills

Install open workflow instructions for verifying connections, publishing,
resuming, reviewing, and governing Handover context:

```bash
npx skills add 44-pixels/handover-mcp --list
npx skills add 44-pixels/handover-mcp --skill handover-publish
```

Browse the catalog at
[skills.handover.sh](https://skills.handover.sh/?utm_source=npm&utm_medium=registry&utm_campaign=cli_launch).
Every skill exposes its plain-language starting request, MCP tools, CLI
commands, and raw `SKILL.md` source.

## Learn more

- [Complete CLI and API setup](https://handover.sh/docs/cli-and-api?utm_source=npm&utm_medium=registry&utm_campaign=cli_launch)
- [MCP and host-specific connection guide](https://handover.sh/install?utm_source=npm&utm_medium=registry&utm_campaign=cli_launch)
- [Public source and Agent Skills](https://github.com/44-pixels/handover-mcp)

Run `handover --help` to see every command.
