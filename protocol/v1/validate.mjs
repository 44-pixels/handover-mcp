#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const requiredRoot = [
  "schemaVersion",
  "objective",
  "currentState",
  "decisions",
  "evidence",
  "constraints",
  "nextAction",
  "ownership",
  "openReview",
];
const stateFields = ["complete", "inProgress", "blocked", "unverified"];
const actorTypes = new Set(["human", "agent", "service"]);
const constraintKinds = new Set([
  "permission",
  "safety",
  "deadline",
  "budget",
  "dependency",
  "exclusion",
  "other",
]);

export function validateContinuityRecord(record) {
  const errors = [];
  const requireObject = (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${path} must be an object`);
      return false;
    }
    return true;
  };
  const requireText = (value, path) => {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${path} must be a non-empty string`);
      return false;
    }
    return true;
  };
  const requireTextList = (value, path) => {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return false;
    }
    value.forEach((item, index) => requireText(item, `${path}[${index}]`));
    return true;
  };
  const requireActor = (value, path) => {
    if (!requireObject(value, path)) return;
    requireText(value.id, `${path}.id`);
    if (!actorTypes.has(value.type)) {
      errors.push(`${path}.type must be human, agent, or service`);
    }
  };

  if (!requireObject(record, "$")) return errors;
  for (const field of requiredRoot) {
    if (!(field in record)) errors.push(`$.${field} is required`);
  }
  if (record.schemaVersion !== "1.0") {
    errors.push("$.schemaVersion must equal 1.0");
  }

  if (requireObject(record.objective, "$.objective")) {
    requireText(record.objective.summary, "$.objective.summary");
    requireTextList(
      record.objective.acceptanceCriteria,
      "$.objective.acceptanceCriteria",
    );
  }
  if (requireObject(record.currentState, "$.currentState")) {
    for (const field of stateFields) {
      requireTextList(record.currentState[field], `$.currentState.${field}`);
    }
  }
  if (!Array.isArray(record.decisions)) {
    errors.push("$.decisions must be an array");
  } else {
    record.decisions.forEach((decision, index) => {
      const path = `$.decisions[${index}]`;
      if (!requireObject(decision, path)) return;
      requireText(decision.summary, `${path}.summary`);
      requireText(decision.rationale, `${path}.rationale`);
      if (!["active", "superseded"].includes(decision.status)) {
        errors.push(`${path}.status must be active or superseded`);
      }
    });
  }
  if (!Array.isArray(record.evidence)) {
    errors.push("$.evidence must be an array");
  } else {
    record.evidence.forEach((evidence, index) => {
      const path = `$.evidence[${index}]`;
      if (!requireObject(evidence, path)) return;
      requireText(evidence.id, `${path}.id`);
      requireText(evidence.label, `${path}.label`);
      if (!evidence.uri && !evidence.artifactRef) {
        errors.push(`${path} must include uri or artifactRef`);
      }
      if (
        evidence.sha256 !== undefined &&
        !/^[a-fA-F0-9]{64}$/.test(evidence.sha256)
      ) {
        errors.push(`${path}.sha256 must be a 64-character hexadecimal digest`);
      }
    });
  }
  if (!Array.isArray(record.constraints)) {
    errors.push("$.constraints must be an array");
  } else {
    record.constraints.forEach((constraint, index) => {
      const path = `$.constraints[${index}]`;
      if (!requireObject(constraint, path)) return;
      if (!constraintKinds.has(constraint.kind)) {
        errors.push(`${path}.kind is not a supported constraint kind`);
      }
      requireText(constraint.text, `${path}.text`);
    });
  }
  if (requireObject(record.nextAction, "$.nextAction")) {
    requireText(record.nextAction.summary, "$.nextAction.summary");
    requireText(record.nextAction.verification, "$.nextAction.verification");
  }
  if (requireObject(record.ownership, "$.ownership")) {
    requireActor(record.ownership.nextActor, "$.ownership.nextActor");
    if (
      record.ownership.reviewers !== undefined &&
      !Array.isArray(record.ownership.reviewers)
    ) {
      errors.push("$.ownership.reviewers must be an array");
    } else {
      record.ownership.reviewers?.forEach((actor, index) =>
        requireActor(actor, `$.ownership.reviewers[${index}]`),
      );
    }
  }
  if (!Array.isArray(record.openReview)) {
    errors.push("$.openReview must be an array");
  } else {
    record.openReview.forEach((review, index) => {
      const path = `$.openReview[${index}]`;
      if (!requireObject(review, path)) return;
      requireText(review.id, `${path}.id`);
      requireText(review.summary, `${path}.summary`);
      if (!["open", "resolved"].includes(review.status)) {
        errors.push(`${path}.status must be open or resolved`);
      }
      if (review.status === "resolved" && !review.resolvedByRevision) {
        errors.push(`${path}.resolvedByRevision is required when resolved`);
      }
      if (review.assignee !== undefined) {
        requireActor(review.assignee, `${path}.assignee`);
      }
    });
  }

  return errors;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    process.stderr.write("Usage: node validate.mjs <continuity-record.json>\n");
    process.exitCode = 2;
    return;
  }
  let record;
  try {
    record = JSON.parse(await readFile(input, "utf8"));
  } catch (error) {
    process.stderr.write(`Invalid JSON: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }
  const errors = validateContinuityRecord(record);
  if (errors.length > 0) {
    process.stderr.write(
      `Handoff Continuity Record is invalid:\n${errors
        .map((error) => `- ${error}`)
        .join("\n")}\n`,
    );
    process.exitCode = 1;
    return;
  }
  process.stdout.write("Handoff Continuity Record v1.0 is valid.\n");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
