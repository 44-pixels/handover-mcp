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

## Safety

Run integration examples in a dedicated test workspace or mark their records
clearly. Never place credentials, hidden reasoning, or unrelated personal data
in artifacts. Preserve useful audit evidence for the intended review window,
then archive the test record.
