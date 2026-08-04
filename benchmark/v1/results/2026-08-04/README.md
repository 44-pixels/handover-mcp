# AI Handoff Continuity Benchmark: two-model pilot

Published: 2026-08-04

Benchmark version: `1.0.0-pilot`

This record contains one complete nine-prompt run from each of two model
systems:

| Provider | Model | Host | Overall score |
| --- | --- | --- | ---: |
| OpenAI | `gpt-5.6-terra` | `codex-cli 0.146.0` | 88.89 |
| Anthropic | `claude-sonnet-5` | `claude-code 2.1.220` | 45.19 |

## Result by context condition

| Condition | Mean | OpenAI | Anthropic |
| --- | ---: | ---: | ---: |
| Structured handoff | 79.45 | 100.00 | 58.89 |
| Conversation transcript | 76.67 | 100.00 | 53.33 |
| Compressed memory | 45.00 | 66.67 | 23.33 |

The structured handoff condition had the highest mean score in this pilot.
That is a result from six condition-level observations, not a general claim
about every model or task. The difference between structured handoff and
transcript was 2.78 points; the difference between structured handoff and
compressed memory was 34.45 points.

## Execution record

- One fresh, ephemeral session was used for every prompt.
- Tools, browsing, retrieval, and cross-prompt memory were disabled.
- The same nine generated prompt files were used for both systems.
- No retries were allowed.
- Temperature was not exposed by either subscription-backed CLI and is
  recorded as `null`.
- Responses had to parse as JSON exactly. Fenced JSON and other malformed
  responses were retained verbatim and scored as missing.
- The published dependency-free runner performed all scoring. No LLM judge was
  used.

## What affected the scores

The benchmark measures retrieval and instruction adherence together. Four
Anthropic responses wrapped otherwise readable JSON in Markdown fences, so
strict parsing marked them missing. Several Anthropic responses also returned
single-value fields as arrays. One OpenAI compressed-memory response returned
candidate text instead of candidate IDs. These are real continuation failures
under the declared contract, but they mean the scores should not be read as a
pure measure of context retention.

## Files

- `summary.json`: machine-readable aggregate and caveats.
- `summary.csv`: flat condition-level result table.
- `openai-submission.json`: strict-parse submission sent to the scorer.
- `openai-result.json`: deterministic per-condition and per-field scores.
- `anthropic-submission.json`: strict-parse submission sent to the scorer.
- `anthropic-result.json`: deterministic per-condition and per-field scores.
- `raw/openai/*.txt`: all nine unmodified OpenAI response bodies.
- `raw/anthropic/*.txt`: all nine unmodified Anthropic response bodies.

The benchmark method, dataset, answer key, prompt generator, and scorer are
published at:

https://handover.sh/benchmark

## Cite this benchmark

Use the canonical citation metadata at:

- https://handover.sh/benchmark/v1/CITATION.cff
- https://handover.sh/benchmark/v1/citation.bib

Suggested citation:

> 44pixels Ltd. (2026). AI Handoff Continuity Benchmark
> (1.0.0-pilot). Handover. https://handover.sh/benchmark

## Limitations

- The dataset contains three authored English-language simulations.
- The three conditions intentionally retain different amounts of information.
- One run per model does not estimate run-to-run variance.
- Subscription-backed CLIs add provider system instructions that are not
  independently controlled by this benchmark.
- Handover created the benchmark and benefits if structured handoffs perform
  well.

Dataset license: CC BY 4.0. Runner license: MIT. Model outputs are published
for benchmark audit and reproduction.
