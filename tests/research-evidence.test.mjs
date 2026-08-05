import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../research/v1/", import.meta.url);
const repositoryRoot = new URL("../", import.meta.url);

test("publishes a bounded, citable research evidence package", async () => {
  const [indexText, schemaText, readme, fieldReport, cff, bibtex, benchmarkText, repositoryReadme] =
    await Promise.all([
      readFile(new URL("index.json", root), "utf8"),
      readFile(new URL("schema.json", root), "utf8"),
      readFile(new URL("README.md", root), "utf8"),
      readFile(new URL("reporter-migration-field-report.md", root), "utf8"),
      readFile(new URL("CITATION.cff", root), "utf8"),
      readFile(new URL("citation.bib", root), "utf8"),
      readFile(
        new URL("benchmark/v1/results/2026-08-04/summary.json", repositoryRoot),
        "utf8",
      ),
      readFile(new URL("README.md", repositoryRoot), "utf8"),
    ]);

  const index = JSON.parse(indexText);
  const schema = JSON.parse(schemaText);
  const benchmark = JSON.parse(benchmarkText);

  assert.equal(index.schemaVersion, "1.0");
  assert.equal(index.version, "1.0.0");
  assert.equal(index.canonical, "https://handover.sh/research");
  assert.equal(index.license, "CC-BY-4.0");
  assert.match(index.publisher.relationship, /benefit/i);
  assert.equal(index.items.length, 4);
  assert.equal(new Set(index.items.map((item) => item.id)).size, 4);

  for (const item of index.items) {
    assert.match(item.canonicalUrl, /^https:\/\/handover\.sh\//);
    assert.match(item.provenance, /^first-party/);
    assert.ok(item.finding.length >= 20);
    assert.ok(item.limitations.length >= 2);
    assert.ok(item.artifacts.length >= 1);
    await access(new URL(item.repositoryPath, repositoryRoot));
  }

  const benchmarkItem = index.items.find(
    (item) => item.id === "ai-handoff-continuity-benchmark",
  );
  assert.ok(benchmarkItem);
  assert.match(
    benchmarkItem.finding,
    new RegExp(String(benchmark.conditionScores[0].meanScore)),
  );
  assert.match(benchmarkItem.finding, /76\.67/);
  assert.match(benchmarkItem.finding, /45\.00/);

  assert.equal(schema.$id, "https://handover.sh/research/v1/schema.json");
  assert.equal(schema.properties.license.const, "CC-BY-4.0");
  assert.match(readme, /first-party/i);
  assert.match(readme, /small retrieval-and-continuation pilot/i);
  assert.match(fieldReport, /400 \/ 400/);
  assert.match(fieldReport, /127/);
  assert.match(cff, /type: dataset/);
  assert.match(cff, /license: CC-BY-4\.0/);
  assert.match(bibtex, /@dataset\{handover_research_evidence_2026/);
  assert.match(repositoryReadme, /\[`research\/v1\/`\]\(research\/v1\/\)/);
});
