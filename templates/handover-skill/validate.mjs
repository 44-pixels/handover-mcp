#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const fileArg = args.find((arg) => arg !== "--json");

if (!fileArg) {
  console.error(
    "Usage: node templates/handover-skill/validate.mjs <path-to-SKILL.md> [--json]",
  );
  process.exit(2);
}

const file = resolve(fileArg);
let source;
try {
  source = await readFile(file, "utf8");
} catch (error) {
  console.error(`Could not read ${fileArg}: ${error.message}`);
  process.exit(2);
}

const result = validateSkill(source, file);

if (json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  printResult(result);
}

process.exitCode = result.valid ? 0 : 1;

function validateSkill(sourceText, filePath) {
  const errors = [];
  const warnings = [];
  const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
  const closing = lines.slice(1).findIndex((line) => line.trim() === "---");

  if (lines[0]?.trim() !== "---" || closing < 0) {
    return {
      valid: false,
      file: filePath,
      name: null,
      errors: ["SKILL.md must start with YAML frontmatter delimited by ---."],
      warnings,
      checks: [],
    };
  }

  const frontmatterEnd = closing + 1;
  const { fields, metadata, parseErrors } = parseFrontmatter(
    lines.slice(1, frontmatterEnd),
  );
  errors.push(...parseErrors);
  const body = lines.slice(frontmatterEnd + 1).join("\n").trim();

  requireField(fields, "name", errors);
  requireField(fields, "description", errors);
  requireField(fields, "license", errors);
  requireField(fields, "compatibility", errors);
  requireField(metadata, "author", errors, "metadata.author");
  requireField(metadata, "version", errors, "metadata.version");

  if (fields.name) {
    if (
      fields.name.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name)
    ) {
      errors.push(
        "name must be 1-64 lowercase letters, numbers, or single hyphens.",
      );
    }
    if (
      basename(filePath) === "SKILL.md" &&
      basename(dirname(filePath)) !== fields.name
    ) {
      errors.push(
        `name "${fields.name}" must match its parent folder "${basename(dirname(filePath))}".`,
      );
    }
  }

  if (fields.description) {
    if (fields.description.length > 1024) {
      errors.push("description must not exceed 1024 characters.");
    }
    if (!/\b(use when|when asked|when the user|for)\b/i.test(fields.description)) {
      warnings.push(
        "description should state when the agent should activate the skill.",
      );
    }
  }

  if (fields.compatibility?.length > 500) {
    errors.push("compatibility must not exceed 500 characters.");
  }
  if (
    metadata.version &&
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(metadata.version)
  ) {
    errors.push("metadata.version must be a quoted semantic version.");
  }
  if (!body) {
    errors.push("SKILL.md must contain workflow instructions after frontmatter.");
  }

  const checks = [
    contractCheck(
      "runtime",
      /Handover MCP|handover-sh CLI|handover CLI/i,
      `${fields.compatibility ?? ""}\n${body}`,
      "Name Handover MCP or the handover-sh CLI used by the workflow.",
      errors,
    ),
    contractCheck(
      "identity",
      /handover\.whoami|handover whoami/i,
      body,
      "Verify the server-resolved Handover identity before protected work.",
      errors,
    ),
    contractCheck(
      "verification",
      /\bverify\b|read[- ]back|pass criteria|control test/i,
      body,
      "Define how the skill verifies its result instead of trusting one successful call.",
      errors,
    ),
    advisoryCheck(
      "credential safety",
      /credential|secret|token/i,
      body,
      "State how credentials, secrets, and tokens are kept out of artifacts and output.",
      warnings,
    ),
    advisoryCheck(
      "denied path",
      /access (?:is )?denied|denied access|read-only|unavailable|failure/i,
      body,
      "Describe at least one denied, read-only, unavailable, or failure path.",
      warnings,
    ),
    advisoryCheck(
      "access boundary",
      /private|least privilege|smallest[^.\n]{0,60}\b(?:role|scope|access)\b|workspace boundary/i,
      body,
      "State the intended access boundary or least-privilege requirement.",
      warnings,
    ),
  ];

  return {
    valid: errors.length === 0,
    file: filePath,
    name: fields.name ?? null,
    errors,
    warnings,
    checks,
  };
}

function parseFrontmatter(lines) {
  const fields = {};
  const metadata = {};
  const parseErrors = [];
  let section = null;

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;

    const nested = rawLine.match(/^  ([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (nested) {
      if (section !== "metadata") {
        parseErrors.push(`Unexpected nested field: ${nested[1]}.`);
      } else {
        metadata[nested[1]] = scalar(nested[2]);
      }
      continue;
    }

    const top = rawLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!top) {
      parseErrors.push(`Could not parse frontmatter line: ${rawLine.trim()}`);
      continue;
    }
    section = top[1];
    fields[top[1]] = scalar(top[2]);
  }

  return { fields, metadata, parseErrors };
}

function scalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function requireField(record, key, errors, label = key) {
  if (!record[key]) errors.push(`${label} is required by the Handover catalog.`);
}

function contractCheck(id, pattern, content, message, errors) {
  const passed = pattern.test(content);
  if (!passed) errors.push(message);
  return { id, level: "required", passed };
}

function advisoryCheck(id, pattern, content, message, warnings) {
  const passed = pattern.test(content);
  if (!passed) warnings.push(message);
  return { id, level: "advisory", passed };
}

function printResult(result) {
  const status = result.valid ? "PASS" : "FAIL";
  console.log(`${status} ${result.name ?? "unknown-skill"} (${result.file})`);
  for (const check of result.checks) {
    console.log(
      `  ${check.passed ? "ok" : check.level === "required" ? "error" : "warn"} ${check.id}`,
    );
  }
  for (const error of result.errors) console.log(`  ERROR ${error}`);
  for (const warning of result.warnings) console.log(`  WARN  ${warning}`);
}
