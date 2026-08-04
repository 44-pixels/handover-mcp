# Handover examples

These examples are inspectable workflow proofs for Handover's hosted MCP
server, CLI, and Agent Skills.

## End-to-end reviewed MCP handoff

[`end-to-end-mcp-handoff-workflow.md`](end-to-end-mcp-handoff-workflow.md)
tests a complete handoff across separate authenticated identities. It
publishes Markdown, SQL, and JSON, reads the source package back, anchors review
to an immutable revision, publishes a correction with optimistic concurrency,
resolves the finding against that correction, and lets a fresh successor
continue.

The procedure also contains negative tests for:

- an identity outside the workspace;
- a read-only identity attempting to write;
- a continuation based on a stale revision; and
- a revoked service credential.

Use the [rendered
guide](https://handover.sh/guides/end-to-end-mcp-agent-handoff?utm_source=github&utm_medium=referral&utm_campaign=mcp_handoff_e2e)
for the rationale and the
[installation flow](https://handover.sh/install?utm_source=github&utm_medium=referral&utm_campaign=mcp_handoff_e2e)
to connect a host before running it.

## Claude Code to Codex context transfer

[`claude-code-to-codex-context-transfer.md`](claude-code-to-codex-context-transfer.md)
separates Codex's supported one-time Claude Code import from a recurring
Handover workflow. It checkpoints Git and `HANDOFF.md` in Claude Code, verifies
the exact record from a fresh Codex session, and appends the next revision with
optimistic concurrency.

The recipe uses separate named service credentials for generic Claude Code and
Codex connections. Handover's per-user Google OAuth remains limited to
explicitly configured clients such as Gatana until first-party dynamic OAuth
registration is available for arbitrary MCP clients.

Use the [rendered
guide](https://handover.sh/guides/transfer-context-from-claude-code-to-codex?utm_source=github&utm_medium=referral&utm_campaign=claude_code_to_codex)
for the decision framework and primary-source explanation.

## Safety

Run integration examples in a dedicated test workspace or mark their records
clearly. Never place credentials, hidden reasoning, or unrelated personal data
in artifacts. Preserve useful audit evidence for the intended review window,
then archive the test record.
