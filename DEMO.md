# Continue a complete human-agent handoff

Handover's public demo is a synthetic, inspectable continuation record. It
shows how one reporting task moves across two agents and a human reviewer
without relying on the original chat.

## Inspect the record

- [Interactive human view](https://handover.sh/demo?utm_source=github&utm_medium=release&utm_campaign=public_continuation_demo)
- [Agent-readable JSON](https://handover.sh/demo.json?utm_source=github&utm_medium=release&utm_campaign=public_continuation_demo)
- [Raw Markdown](https://handover.sh/demo/context.md)
- [Raw SQL](https://handover.sh/demo/inventory.sql)
- [Evidence JSON](https://handover.sh/demo/evidence.json)

The record includes:

- an explicit objective and current state;
- Markdown, SQL, JSON, and a visual artifact;
- three attributable revisions;
- a human review note attached to exact evidence;
- the revision that resolved the note; and
- one bounded next action for the succeeding actor.

No account is required to inspect or retrieve these public artifacts.

## Continue it yourself

[Continue this handover in Handover](https://handover.sh/app?start=demo&utm_source=github&utm_medium=release&utm_campaign=public_continuation_demo).

After sign-in, Handover opens a private draft containing the demo's objective,
state, decisions, open question, next action, and `context.md`. Review and edit
the draft before selecting **Create**. Following the link alone never creates
private context.

The resulting handover is a normal versioned record. A person or agent can read
it, annotate an artifact, publish a revision, or retrieve it through MCP or the
CLI.

## Continue it with an agent

1. Inspect [`demo.json`](https://handover.sh/demo.json).
2. [Connect Handover MCP](CONNECTING.md) with your own named identity.
3. Search for or create a handover.
4. Read the current revision and every referenced artifact.
5. Perform one bounded next action.
6. Publish the continuation as a new revision.
7. Read the saved revision back and verify authorship.

For a multi-identity qualification with denied, stale-revision, and revoked
credential checks, run the
[end-to-end MCP handoff workflow](examples/end-to-end-mcp-handoff-workflow.md).

## What this proves

The demo proves the shape and usability of a continuation record. It does not
prove that every handoff will succeed, that a model understands every artifact,
or that transport connectivity equals workflow continuity. Use the benchmark
and end-to-end test for those broader questions.

- [Open continuity benchmark](https://handover.sh/benchmark?utm_source=github&utm_medium=release&utm_campaign=continuity_benchmark_results)
- [Handoff Continuity Record](https://handover.sh/protocol?utm_source=github&utm_medium=release&utm_campaign=handoff_continuity_record)
- [Install the CLI or MCP connection](https://handover.sh/install?utm_source=github&utm_medium=release&utm_campaign=public_continuation_demo)

