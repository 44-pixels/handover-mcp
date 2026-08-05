#!/usr/bin/env node

import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { basename, dirname, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { scoreSubmission } from "../run.mjs";

const BENCHMARK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_RELATIONSHIPS = new Set([
  "independent",
  "customer",
  "partner",
  "employee",
  "other",
]);

main().catch((error) => {
  process.stderr.write(
    `independent-result: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});

async function main() {
  const packageArgument = process.argv[2];
  if (!packageArgument || packageArgument === "--help") {
    printHelp();
    return;
  }

  const requestedRoot = resolve(packageArgument);
  if ((await lstat(requestedRoot)).isSymbolicLink()) {
    throw new Error(`Symlinks are not allowed: ${requestedRoot}`);
  }
  const packageRoot = await realpath(requestedRoot);
  const [manifest, submission, result, dataset, notes] = await Promise.all([
    readJson(packageRoot, "manifest.json"),
    readJson(packageRoot, "submission.json"),
    readJson(packageRoot, "result.json"),
    readJson(BENCHMARK_ROOT, "dataset.json"),
    readText(packageRoot, "README.md"),
  ]);

  validateManifest(manifest, basename(packageRoot));
  validateNotes(notes);
  await validateRawResponses(packageRoot, dataset);

  const recomputed = scoreSubmission(dataset, submission);
  compareResult(result, recomputed);

  process.stdout.write(
    `Independent result package passed: ${manifest.runId} · ${recomputed.overallScore.toFixed(2)} / 100 · ${recomputed.answered}/${recomputed.total} answers\n`,
  );
}

async function readJson(root, relativePath) {
  return JSON.parse(await readText(root, relativePath));
}

async function readText(root, relativePath) {
  const target = safePath(root, relativePath);
  await refuseSymlink(target);
  return readFile(target, "utf8");
}

function safePath(root, relativePath) {
  const target = resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    throw new Error(`Unsafe package path: ${relativePath}`);
  }
  return target;
}

async function refuseSymlink(target) {
  const stats = await lstat(target);
  if (stats.isSymbolicLink()) {
    throw new Error(`Symlinks are not allowed: ${target}`);
  }
  const resolved = await realpath(target);
  if (resolved !== target) {
    throw new Error(`Package path must resolve directly: ${target}`);
  }
}

function validateManifest(manifest, directoryName) {
  if (manifest.schemaVersion !== "1.0") {
    throw new Error("manifest schemaVersion must be 1.0");
  }
  if (manifest.benchmarkVersion !== "1.0.0-pilot") {
    throw new Error("manifest benchmarkVersion must be 1.0.0-pilot");
  }
  if (manifest.runId !== directoryName) {
    throw new Error("manifest runId must match the package directory name");
  }
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.runId)) {
    throw new Error("manifest runId must use YYYY-MM-DD-provider-model");
  }
  if (Number.isNaN(Date.parse(manifest.runAt))) {
    throw new Error("manifest runAt must be an ISO date-time");
  }
  if (!manifest.submitter?.name || manifest.submitter.name.length < 2) {
    throw new Error("submitter name is required");
  }
  if (!EXPECTED_RELATIONSHIPS.has(manifest.submitter.relationship)) {
    throw new Error("submitter relationship is invalid");
  }
  if (!manifest.submitter.disclosure || manifest.submitter.disclosure.length < 30) {
    throw new Error("submitter disclosure must contain at least 30 characters");
  }
  for (const field of ["provider", "model", "modelVersion", "interface", "retryPolicy"]) {
    if (!manifest.environment?.[field]) {
      throw new Error(`environment ${field} is required`);
    }
  }
  for (const capability of [
    "toolsEnabled",
    "browsingEnabled",
    "memoryEnabled",
    "retrievalEnabled",
  ]) {
    if (manifest.environment?.[capability] !== false) {
      throw new Error(`${capability} must be false`);
    }
  }
  const expectedArtifacts = {
    submission: "submission.json",
    result: "result.json",
    rawResponses: "raw-responses",
    notes: "README.md",
  };
  for (const [field, expected] of Object.entries(expectedArtifacts)) {
    if (manifest.artifacts?.[field] !== expected) {
      throw new Error(`artifacts.${field} must be ${expected}`);
    }
  }
  for (const declaration of [
    "allRunsIncluded",
    "invalidResponsesPreserved",
    "noUndeclaredRepairs",
    "noPrivateData",
  ]) {
    if (manifest.declarations?.[declaration] !== true) {
      throw new Error(`declarations.${declaration} must be true`);
    }
  }
  if (manifest.declarations?.license !== "CC-BY-4.0") {
    throw new Error("declarations.license must be CC-BY-4.0");
  }
}

function validateNotes(notes) {
  for (const heading of [
    "Relationship disclosure",
    "Execution method",
    "Material limitations",
  ]) {
    if (!new RegExp(`^## ${heading}$`, "m").test(notes)) {
      throw new Error(`README.md must include a '${heading}' section`);
    }
  }
  const limitations = notes.split(/^## Material limitations$/m)[1] ?? "";
  const limitationCount = limitations.match(/^- /gm)?.length ?? 0;
  if (limitationCount < 2) {
    throw new Error("README.md must include at least two material limitations");
  }
}

async function validateRawResponses(packageRoot, dataset) {
  const rawRoot = safePath(packageRoot, "raw-responses");
  await refuseSymlink(rawRoot);
  const expected = new Set(
    dataset.cases.flatMap((benchmarkCase) =>
      dataset.conditions.map(
        (condition) => `${benchmarkCase.id}.${condition.id}.txt`,
      ),
    ),
  );
  const entries = await readdir(rawRoot, { withFileTypes: true });
  const actual = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new Error(`raw-responses may contain only regular files: ${entry.name}`);
    }
    if (!expected.has(entry.name)) {
      throw new Error(`Unexpected raw response: ${entry.name}`);
    }
    const content = await readFile(safePath(rawRoot, entry.name), "utf8");
    if (!content.trim()) {
      throw new Error(`Raw response is empty: ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new Error(`Missing raw response: ${filename}`);
    }
  }
}

function compareResult(result, recomputed) {
  const comparable = (value) => ({
    benchmark: value.benchmark,
    benchmarkVersion: value.benchmarkVersion,
    submission: value.submission,
    overallScore: value.overallScore,
    answered: value.answered,
    total: value.total,
    byCondition: value.byCondition,
    rows: value.rows,
  });
  if (
    JSON.stringify(comparable(result)) !==
    JSON.stringify(comparable(recomputed))
  ) {
    throw new Error(
      "result.json does not match the deterministic score recomputed from submission.json",
    );
  }
}

function printHelp() {
  process.stdout.write(`Validate an independent AI Handoff Continuity Benchmark result

Usage:
  node benchmark/v1/independent-results/validate.mjs <result-package-directory>
`);
}
