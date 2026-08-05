# Independent benchmark results

Status: open for independently produced evidence.

Accepted results will appear below only after their package passes the
deterministic validator and a human checks the disclosure, execution boundary,
raw responses, and limitations. There are currently **no accepted independent
results**. Handover's authored pilot remains first-party evidence.

## Frozen method

Use the immutable
[`benchmark-v1.0.0`](https://github.com/44-pixels/handover-mcp/releases/tag/benchmark-v1.0.0)
release. Run every exported prompt in a fresh session with tools, browsing,
memory, and retrieval disabled. Use the same dataset and declared retry policy
for every compared system.

Do not silently repair invalid JSON or omit failed runs. A declared retry rule
may be used, but every original response and retry must remain in the package.

## Package layout

Create one directory named `YYYY-MM-DD-provider-model`:

```text
manifest.json
submission.json
result.json
README.md
raw-responses/
  case-id.condition-id.txt
```

Start `manifest.json` from
[`manifest.template.json`](manifest.template.json). Generate
`submission.json` and `result.json` with the frozen runner:

```bash
node benchmark/v1/run.mjs --prompts ./prompts
node benchmark/v1/run.mjs --template ./submission.json
node benchmark/v1/run.mjs --submission ./submission.json \
  --format json --output ./result.json
```

Keep one raw response for each case and condition. The raw filename must match
the prompt filename and end in `.txt`.

The package `README.md` must state the result, relationship disclosure,
execution method, retries and invalid outputs, and at least two material
limitations. It must not make a general model-ranking claim from this pilot.

## Validate

The dependency-free validator recomputes every deterministic score from the
submitted answers and rejects mismatched output, missing raw responses,
undeclared execution capabilities, incomplete disclosure, symlinks, and
unsafe paths.

```bash
node benchmark/v1/independent-results/validate.mjs \
  ./benchmark/v1/independent-results/2026-08-05-provider-model
```

Validation proves package completeness and score reproducibility. It does not
prove that the declared model produced the raw responses or that the
experimental setup was followed. Those remain provenance claims for human
review.

## Submit

Open the
[independent result issue form](https://github.com/44-pixels/handover-mcp/issues/new?template=independent-benchmark-result.yml)
with a public package URL, or open a pull request adding the package beneath
this directory. Accepted packages stay attributed to their submitter and use
CC BY 4.0.

| Run | Submitter | System | Status |
| --- | --- | --- | --- |
| - | - | - | No accepted independent results yet |

