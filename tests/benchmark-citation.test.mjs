import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../benchmark/v1/", import.meta.url);

test("publishes a citable benchmark package with matching pilot values", async () => {
  const [cff, bibtex, csv, summary, methodology, results, readme] =
    await Promise.all([
      readFile(new URL("CITATION.cff", root), "utf8"),
      readFile(new URL("citation.bib", root), "utf8"),
      readFile(new URL("results/2026-08-04/summary.csv", root), "utf8"),
      readFile(new URL("results/2026-08-04/summary.json", root), "utf8"),
      readFile(new URL("README.md", root), "utf8"),
      readFile(new URL("results/2026-08-04/README.md", root), "utf8"),
      readFile(new URL("../README.md", import.meta.url), "utf8"),
    ]);

  assert.match(cff, /cff-version: 1\.2\.0/);
  assert.match(cff, /type: dataset/);
  assert.match(cff, /license: CC-BY-4\.0/);
  assert.match(bibtex, /@dataset\{handover_continuity_benchmark_2026/);
  assert.equal(csv.trim().split("\n").length, 4);
  assert.match(csv, /Structured handoff,79\.45,100\.00,58\.89/);

  const aggregate = JSON.parse(summary);
  assert.equal(
    aggregate.files.citationCff,
    "https://handover.sh/benchmark/v1/CITATION.cff",
  );
  assert.equal(
    aggregate.files.summaryCsv,
    "https://handover.sh/benchmark/v1/results/2026-08-04/summary.csv",
  );
  assert.match(methodology, /## Cite and reuse/);
  assert.match(results, /## Cite this benchmark/);
  assert.match(readme, /\[`CITATION\.cff`\]\(benchmark\/v1\/CITATION\.cff\)/);
});
