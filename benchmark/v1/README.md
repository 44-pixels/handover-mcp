# AI Handoff Continuity Benchmark

Version: `1.0.0-pilot`

Status: open pilot; methodology is frozen for feedback. A two-model pilot run
with raw responses and deterministic scores was published on 2026-08-04. No
general model leaderboard is claimed.

The benchmark tests whether a model can recover the state needed to continue
interrupted work when the same work is represented as:

1. a chronological conversation transcript;
2. a compressed free-form memory;
3. a structured continuation handoff.

It is a retrieval-and-continuation benchmark, not a general intelligence
benchmark. It does not measure code quality, tool execution, reasoning depth,
or the quality of a context platform.

## Why deterministic scoring

Each case supplies fixed candidate statements and one answer key. The model
selects the objective, current state, decisions, evidence, constraints, next
action, owner, and open questions that remain supportable. The runner scores
single-value fields by exact match and multi-value fields with set F1.

This avoids an LLM judge and makes every score reproducible. The tradeoff is
that the benchmark measures state recovery from candidates rather than
open-ended continuation quality.

## Rubric

| Dimension | Points |
| --- | ---: |
| Objective | 10 |
| Current state | 20 |
| Decisions | 15 |
| Evidence | 15 |
| Constraints | 10 |
| Next action | 15 |
| Owner | 5 |
| Open questions | 10 |

Each of the three conditions receives the same 100-point rubric. Overall score
is the mean across every case and condition. Missing answers score zero.

## Run it

Requires Node.js 22 or newer and has no package dependencies.

```bash
curl -fsSLO https://handover.sh/benchmark/v1/run.mjs
curl -fsSLO https://handover.sh/benchmark/v1/dataset.json

node run.mjs --validate-scorer
node run.mjs --prompts ./prompts
node run.mjs --template ./submission.json
```

Run each prompt in a fresh model session with tools, browsing, memory, and
retrieval disabled. Put each JSON response into the matching answer in
`submission.json`, then score it:

```bash
node run.mjs --submission ./submission.json
node run.mjs --submission ./submission.json --format json \
  --output ./result.json
```

## Reproducibility record

Record the provider, exact model/version, date, temperature, system prompt, API
or host, and any retry policy. Use one fresh session per prompt. Do not repair
invalid JSON unless the retry rule was declared before the run.

For a comparison, every model must receive the same dataset version and prompt
files. Report all runs, including failed parses and missing responses.

## Dataset limitations

- The cases are authored, English-language simulations rather than sampled
  production handovers.
- Candidate selection favors deterministic scoring over natural output.
- The three context conditions intentionally differ in structure and retained
  detail; the benchmark does not isolate formatting from information loss.
- Three pilot cases are enough to validate the protocol, not to rank the
  general capabilities of a model family.
- Handover created the dataset and has an interest in structured handoffs.
  Raw prompts, answer keys, and scoring code are public so that bias can be
  inspected.

## Published pilot results

The first two-system pilot used OpenAI `gpt-5.6-terra` through
`codex-cli 0.146.0` and Anthropic `claude-sonnet-5` through
`claude-code 2.1.220`. The structured handoff condition had the highest mean
score at 79.45, followed by the conversation transcript at 76.67 and compressed
memory at 45.00.

This is a six-observation condition comparison, not a general model ranking.
Schema adherence affected the scores, and one run per system does not estimate
variance. The complete result, caveats, strict-parse submissions, and all 18
raw response bodies are available at:

https://handover.sh/benchmark/v1/results/2026-08-04/README.md

## Files

- `dataset.json`: cases, context conditions, candidates, answer keys, rubric.
- `run.mjs`: prompt exporter, submission template generator, deterministic
  scorer, and scorer self-test.

Dataset license: CC BY 4.0. Runner license: MIT.

Canonical methodology:
https://handover.sh/benchmark
