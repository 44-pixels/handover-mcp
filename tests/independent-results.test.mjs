import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { scoreSubmission } from "../benchmark/v1/run.mjs";

const execFileAsync = promisify(execFile);
const benchmarkRoot = new URL("../benchmark/v1/", import.meta.url);
const validator = new URL(
  "../benchmark/v1/independent-results/validate.mjs",
  import.meta.url,
);

test("accepts a complete independently reproducible result package", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "handover-result-"));
  const packageRoot = join(
    temporaryRoot,
    "2026-08-05-independent-reference",
  );
  try {
    const fixture = await writeFixture(packageRoot);
    const { stdout } = await execFileAsync(
      process.execPath,
      [validator.pathname, packageRoot],
      { cwd: new URL("../", import.meta.url) },
    );

    assert.match(stdout, /Independent result package passed/);
    assert.match(stdout, /100\.00 \/ 100/);

    fixture.result.overallScore = 99;
    await writeFile(
      join(packageRoot, "result.json"),
      `${JSON.stringify(fixture.result, null, 2)}\n`,
    );
    await assert.rejects(
      execFileAsync(process.execPath, [validator.pathname, packageRoot]),
      (error) => {
        assert.match(
          error.stderr,
          /does not match the deterministic score/,
        );
        return true;
      },
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("publishes a bounded independent evidence intake", async () => {
  const [guide, schemaText, templateText, issueForm, contributing, readme] =
    await Promise.all([
      readFile(
        new URL(
          "../benchmark/v1/independent-results/README.md",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../benchmark/v1/independent-results/schema.json",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../benchmark/v1/independent-results/manifest.template.json",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../.github/ISSUE_TEMPLATE/independent-benchmark-result.yml",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8"),
      readFile(new URL("../README.md", import.meta.url), "utf8"),
    ]);

  const schema = JSON.parse(schemaText);
  const template = JSON.parse(templateText);
  assert.equal(schema.properties.benchmarkVersion.const, "1.0.0-pilot");
  assert.equal(schema.properties.environment.properties.toolsEnabled.const, false);
  assert.equal(template.declarations.license, "CC-BY-4.0");
  assert.match(guide, /no accepted independent results/i);
  assert.match(guide, /does not\s+prove that the declared model/i);
  assert.match(issueForm, /Relationship and incentive disclosure/);
  assert.match(issueForm, /every run, including invalid JSON/);
  assert.match(contributing, /independent-results guide/);
  assert.match(readme, /Run and submit an independent benchmark result/);
});

async function writeFixture(packageRoot) {
  const dataset = JSON.parse(
    await readFile(new URL("dataset.json", benchmarkRoot), "utf8"),
  );
  const manifest = JSON.parse(
    await readFile(
      new URL("independent-results/manifest.template.json", benchmarkRoot),
      "utf8",
    ),
  );
  manifest.runId = "2026-08-05-independent-reference";
  const submission = {
    benchmarkVersion: dataset.version,
    system: {
      provider: "Independent fixture",
      model: "Reference answer",
      modelVersion: "1",
      temperature: 0,
      runAt: "2026-08-05T00:00:00.000Z",
    },
    answers: dataset.cases.flatMap((benchmarkCase) =>
      dataset.conditions.map((condition) => ({
        caseId: benchmarkCase.id,
        condition: condition.id,
        answer: benchmarkCase.expected,
      })),
    ),
  };
  const result = scoreSubmission(dataset, submission);

  await mkdir(join(packageRoot, "raw-responses"), { recursive: true });
  await Promise.all([
    writeFile(
      join(packageRoot, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    ),
    writeFile(
      join(packageRoot, "submission.json"),
      `${JSON.stringify(submission, null, 2)}\n`,
    ),
    writeFile(
      join(packageRoot, "result.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    ),
    writeFile(
      join(packageRoot, "README.md"),
      `# Independent reference fixture

## Relationship disclosure

This is a test fixture with no relationship to Handover.

## Execution method

Reference answers exercise the deterministic package validator.

## Material limitations

- This fixture does not represent a model run.
- It validates package integrity rather than experimental provenance.
`,
    ),
    ...dataset.cases.flatMap((benchmarkCase) =>
      dataset.conditions.map((condition) =>
        writeFile(
          join(
            packageRoot,
            "raw-responses",
            `${benchmarkCase.id}.${condition.id}.txt`,
          ),
          '{"fixture":true}\n',
        ),
      ),
    ),
  ]);

  return { result };
}
