#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_DATASET = new URL("./dataset.json", import.meta.url);
const DIMENSIONS = [
  "objective",
  "currentState",
  "decisions",
  "evidence",
  "constraints",
  "nextAction",
  "owner",
  "openQuestions",
];
const SINGLE_VALUE = new Set(["objective", "nextAction", "owner"]);

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(
      `continuity-benchmark: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const dataset = JSON.parse(
    await readFile(options.dataset ?? DEFAULT_DATASET, "utf8"),
  );
  validateDataset(dataset);

  if (options.prompts) {
    await exportPrompts(dataset, options.prompts);
    process.stdout.write(
      `Wrote ${dataset.cases.length * dataset.conditions.length} prompts to ${options.prompts}\n`,
    );
    return;
  }
  if (options.template) {
    const template = submissionTemplate(dataset);
    await writeFile(options.template, `${JSON.stringify(template, null, 2)}\n`);
    process.stdout.write(`Wrote submission template to ${options.template}\n`);
    return;
  }
  if (options.validateScorer) {
    const score = scoreSubmission(dataset, referenceSubmission(dataset));
    if (score.overallScore !== 100) {
      throw new Error(`Reference scorer validation returned ${score.overallScore}.`);
    }
    process.stdout.write("Scorer validation passed: reference submission = 100.00\n");
    return;
  }
  if (!options.submission) {
    printHelp();
    return;
  }

  const submission = JSON.parse(await readFile(options.submission, "utf8"));
  const result = scoreSubmission(dataset, submission);
  const output =
    options.format === "json"
      ? `${JSON.stringify(result, null, 2)}\n`
      : renderMarkdown(result);
  if (options.output) {
    await writeFile(options.output, output);
  } else {
    process.stdout.write(output);
  }
}

export function scoreSubmission(dataset, submission) {
  if (!submission || !Array.isArray(submission.answers)) {
    throw new Error("Submission must contain an answers array.");
  }
  if (submission.benchmarkVersion !== dataset.version) {
    throw new Error(
      `Submission targets ${submission.benchmarkVersion ?? "no version"}; expected ${dataset.version}.`,
    );
  }
  const answers = new Map(
    submission.answers.map((answer) => [
      `${answer.caseId}:${answer.condition}`,
      answer,
    ]),
  );
  const rows = [];
  for (const benchmarkCase of dataset.cases) {
    for (const condition of dataset.conditions) {
      const key = `${benchmarkCase.id}:${condition.id}`;
      const answer = answers.get(key);
      const dimensions = Object.fromEntries(
        DIMENSIONS.map((dimension) => {
          const expected = benchmarkCase.expected[dimension];
          const actual = answer?.answer?.[dimension];
          const accuracy = SINGLE_VALUE.has(dimension)
            ? Number(actual === expected)
            : setF1(expected, actual);
          return [
            dimension,
            {
              score: round(accuracy * dataset.rubric[dimension]),
              maximum: dataset.rubric[dimension],
            },
          ];
        }),
      );
      rows.push({
        caseId: benchmarkCase.id,
        caseTitle: benchmarkCase.title,
        condition: condition.id,
        answered: Boolean(answer),
        score: round(
          Object.values(dimensions).reduce((total, value) => total + value.score, 0),
        ),
        dimensions,
      });
    }
  }
  const byCondition = dataset.conditions.map((condition) => {
    const matching = rows.filter((row) => row.condition === condition.id);
    return {
      condition: condition.id,
      label: condition.label,
      score: round(
        matching.reduce((total, row) => total + row.score, 0) /
          matching.length,
      ),
      answered: matching.filter((row) => row.answered).length,
      total: matching.length,
    };
  });
  return {
    benchmark: dataset.name,
    benchmarkVersion: dataset.version,
    submission: submission.system ?? {},
    scoredAt: new Date().toISOString(),
    overallScore: round(
      rows.reduce((total, row) => total + row.score, 0) / rows.length,
    ),
    answered: rows.filter((row) => row.answered).length,
    total: rows.length,
    byCondition,
    rows,
  };
}

function setF1(expected, actual) {
  const expectedSet = new Set(Array.isArray(expected) ? expected : []);
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  if (!expectedSet.size && !actualSet.size) return 1;
  if (!actualSet.size) return 0;
  const truePositive = [...actualSet].filter((item) => expectedSet.has(item)).length;
  const precision = truePositive / actualSet.size;
  const recall = truePositive / expectedSet.size;
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}

async function exportPrompts(dataset, outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  for (const benchmarkCase of dataset.cases) {
    for (const condition of dataset.conditions) {
      const prompt = renderPrompt(dataset, benchmarkCase, condition.id);
      await writeFile(
        resolve(outputDirectory, `${benchmarkCase.id}.${condition.id}.txt`),
        prompt,
      );
    }
  }
}

function renderPrompt(dataset, benchmarkCase, condition) {
  return `You are taking over interrupted work. Use only the supplied context.
Select the candidate IDs that describe the current, supportable continuation
state. Do not select superseded, completed, or unsupported claims.

Return JSON only:
${JSON.stringify(submissionTemplateAnswer(), null, 2)}

TASK
${benchmarkCase.task}

CANDIDATES
${JSON.stringify(benchmarkCase.candidates, null, 2)}

CONTEXT (${condition})
${benchmarkCase.contexts[condition]}

BENCHMARK
${dataset.name} ${dataset.version}
CASE
${benchmarkCase.id}
CONDITION
${condition}
`;
}

function submissionTemplate(dataset) {
  return {
    benchmarkVersion: dataset.version,
    system: {
      provider: "replace-me",
      model: "replace-me",
      modelVersion: "replace-me",
      temperature: 0,
      runAt: new Date().toISOString(),
    },
    answers: dataset.cases.flatMap((benchmarkCase) =>
      dataset.conditions.map((condition) => ({
        caseId: benchmarkCase.id,
        condition: condition.id,
        answer: submissionTemplateAnswer(),
      })),
    ),
  };
}

function submissionTemplateAnswer() {
  return {
    objective: "",
    currentState: [],
    decisions: [],
    evidence: [],
    constraints: [],
    nextAction: "",
    owner: "",
    openQuestions: [],
  };
}

function referenceSubmission(dataset) {
  return {
    benchmarkVersion: dataset.version,
    system: { provider: "reference", model: "answer-key" },
    answers: dataset.cases.flatMap((benchmarkCase) =>
      dataset.conditions.map((condition) => ({
        caseId: benchmarkCase.id,
        condition: condition.id,
        answer: benchmarkCase.expected,
      })),
    ),
  };
}

function validateDataset(dataset) {
  if (!dataset?.version || !Array.isArray(dataset.cases)) {
    throw new Error("Dataset is missing a version or cases.");
  }
  for (const dimension of DIMENSIONS) {
    if (!Number.isFinite(dataset.rubric?.[dimension])) {
      throw new Error(`Rubric is missing ${dimension}.`);
    }
  }
  const rubricTotal = Object.values(dataset.rubric).reduce(
    (total, value) => total + value,
    0,
  );
  if (rubricTotal !== 100) {
    throw new Error(`Rubric totals ${rubricTotal}; expected 100.`);
  }
  for (const benchmarkCase of dataset.cases) {
    for (const condition of dataset.conditions) {
      if (!benchmarkCase.contexts?.[condition.id]) {
        throw new Error(
          `${benchmarkCase.id} is missing ${condition.id} context.`,
        );
      }
    }
  }
}

function renderMarkdown(result) {
  const rows = result.byCondition
    .map(
      (row) =>
        `| ${row.label} | ${row.score.toFixed(2)} | ${row.answered}/${row.total} |`,
    )
    .join("\n");
  return `# ${result.benchmark} result

- Benchmark: ${result.benchmarkVersion}
- Provider: ${result.submission.provider ?? "not supplied"}
- Model: ${result.submission.model ?? "not supplied"}
- Overall score: ${result.overallScore.toFixed(2)} / 100
- Complete answers: ${result.answered}/${result.total}

| Condition | Score | Complete |
| --- | ---: | ---: |
${rows}
`;
}

function parseArguments(arguments_) {
  const options = { format: "markdown" };
  for (let index = 0; index < arguments_.length; index += 1) {
    const value = arguments_[index];
    if (value === "--submission") options.submission = arguments_[++index];
    else if (value === "--dataset") options.dataset = arguments_[++index];
    else if (value === "--output") options.output = arguments_[++index];
    else if (value === "--format") options.format = arguments_[++index];
    else if (value === "--prompts") options.prompts = arguments_[++index];
    else if (value === "--template") options.template = arguments_[++index];
    else if (value === "--validate-scorer") options.validateScorer = true;
    else if (value === "--help") options.help = true;
    else throw new Error(`Unknown option ${value}.`);
  }
  if (!["json", "markdown"].includes(options.format)) {
    throw new Error("Format must be json or markdown.");
  }
  return options;
}

function printHelp() {
  process.stdout.write(`AI Handoff Continuity Benchmark

Usage:
  node run.mjs --prompts ./prompts
  node run.mjs --template ./submission.json
  node run.mjs --submission ./submission.json [--format json|markdown]
  node run.mjs --validate-scorer

Options:
  --dataset <path>       Use another compatible dataset
  --output <path>        Write scored output to a file
  --help                 Show this help
`);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
