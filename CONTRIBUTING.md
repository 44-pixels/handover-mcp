# Contributing to Handover

Handover accepts focused contributions that improve reproducibility, agent
compatibility, documentation, and independently produced evidence.

Do not include API tokens, OAuth codes, cookies, private handovers, customer
data, proprietary prompts, or internal company material in an issue or pull
request.

## Submit an independent benchmark result

Independent runs of the AI Handoff Continuity Benchmark are especially useful.
The benchmark has a frozen pilot method, deterministic scorer, and a strict
result package so another person can inspect and reproduce the claim.

Start with the
[independent-results guide](benchmark/v1/independent-results/README.md). A
complete result contains:

- the declared provider, model version, host, temperature, and retry policy;
- confirmation that tools, browsing, memory, and retrieval were disabled;
- the unedited submission used by the deterministic scorer;
- the scored result JSON;
- one raw response for every case and condition;
- a relationship disclosure and material limitations; and
- CC BY 4.0 permission for the submitted evidence package.

Run the package validator before opening a pull request:

```bash
node benchmark/v1/independent-results/validate.mjs ./path/to/result-package
```

Use the
[independent result issue form](https://github.com/44-pixels/handover-mcp/issues/new?template=independent-benchmark-result.yml)
for a proposal or question. Use a pull request when the complete, public-safe
package is ready.

Handover may reject a result that cannot be reproduced, omits failed runs,
changes the frozen method, lacks a material relationship disclosure, or
contains private data. Accepted evidence remains attributed to its submitter;
acceptance does not imply endorsement by either party.

## Other contributions

For MCP connection or documentation defects, open a regular issue with the
smallest safe reproduction. For Agent Skill changes, follow the checks in the
pull request template and include successful and denied-path evidence.
