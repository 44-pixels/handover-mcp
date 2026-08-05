# Handover Research and Evidence Index v1.0

This package makes Handover's public research and operational evidence
inspectable from a stable repository location. It covers four distinct kinds
of evidence:

1. a reproducible AI handoff continuity benchmark;
2. a first-party production migration field report;
3. a stable, platform-neutral continuation record; and
4. a runnable human-agent continuation demo.

The canonical human view is:

https://handover.sh/research

The current production JSON view is:

https://handover.sh/research.json

`index.json` is the versioned repository snapshot. Validate its structure
against `schema.json`. Use `CITATION.cff` or `citation.bib` when referring to
the collection as a whole.

## What this package establishes

### AI Handoff Continuity Benchmark

In a two-system authored pilot, structured handoffs scored 79.45, compared
with 76.67 for conversation transcripts and 45.00 for compressed memory.

The dataset, answer key, scorer, submissions, deterministic result files, and
all 18 raw response bodies are published under [`benchmark/v1/`](../../benchmark/v1/).
This is a small retrieval-and-continuation pilot, not a model leaderboard.

### Reporter to Handover migration

44pixels inventoried 1,497 Reporter source reports and verified 1,370 Handover
records. All 400 comparable file hashes matched; 127 reports remained blocked
for review.

This is a first-party operational result from one internal corpus. Digest
equality proves byte equality for comparable files, not semantic equivalence
of every report. See [`reporter-migration-field-report.md`](reporter-migration-field-report.md).

### Handoff Continuity Record

The stable v1.0 JSON format separates objective, state, decisions, evidence,
constraints, next action, ownership, and open review from transport, routing,
authentication, storage, and tool invocation. The schema, example, and
validator are published under [`protocol/v1/`](../../protocol/v1/).

Structural conformance does not prove that a record is true, complete, fresh,
or authorized.

### Human-agent continuation demo

The public demo exposes one continuation record through HTML, JSON, Markdown,
SQL, and a bounded successor prompt. It contains three actors, three revisions,
and one resolved review.

The demo is curated runnable evidence of inspectability and continuation
mechanics. It is not an independent user study or a task-quality result. See
[`DEMO.md`](../../DEMO.md).

## Reuse

The index, schema, citation metadata, and this explanatory document are
licensed under CC BY 4.0. Linked software and repository materials retain their
declared licenses. Handover created this package and benefits if structured
handoffs and its product are adopted.

Suggested citation:

> Yasour, Noam. (2026). Handover Research and Evidence Index (1.0.0).
> Handover. https://handover.sh/research
