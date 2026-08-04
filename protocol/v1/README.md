# Handoff Continuity Record v1.0

The Handoff Continuity Record is a platform-neutral JSON format for preserving
the state another human or AI agent needs to verify and continue interrupted
work.

It records:

1. the objective and acceptance criteria;
2. complete, in-progress, blocked, and unverified state;
3. active and superseded decisions with rationale;
4. evidence references and optional integrity digests;
5. permissions, safety rules, deadlines, budgets, and other constraints;
6. one concrete next action and its verification;
7. the next responsible human, agent, or service;
8. open and resolved review items;
9. optional provenance and namespaced extensions.

## Files

- `schema.json`: JSON Schema Draft 2020-12 contract.
- `example.json`: valid inventory-reporting handoff.
- `validate.mjs`: dependency-free structural conformance checker.

Canonical overview: <https://handover.sh/protocol>

## Validate

```bash
curl -O https://handover.sh/protocol/v1/validate.mjs
curl -O https://handover.sh/protocol/v1/example.json
node validate.mjs example.json
```

Expected output:

```text
Handoff Continuity Record v1.0 is valid.
```

The validator checks the normative continuation fields and relationships needed
for the reference workflow. Full JSON Schema validators can use
`https://handover.sh/protocol/v1/schema.json`.

## Conformance

A conforming producer:

- emits `schemaVersion: "1.0"`;
- completes every required top-level field;
- keeps unknown implementation data under `extensions`;
- references evidence instead of embedding credentials or hidden reasoning;
- records unresolved feedback in `openReview`;
- links a resolved review item to `resolvedByRevision`.

A conforming receiver:

- identifies the objective and acceptance criteria before acting;
- distinguishes verified state from `unverified` claims;
- reads the evidence needed for the next action;
- observes every applicable constraint;
- confirms the next actor and verification step;
- does not treat a resolved review item as evidence unless the linked revision
  is available.

## Scope

The record does not define agent routing, transport, authentication, tool
invocation, or storage. MCP can expose the tools used to read and write a
record. A2A or an orchestration framework can route work between actors.
Repositories and shared context services can store it.

## Security

Never include passwords, access tokens, private keys, session cookies, hidden
chain-of-thought, or unnecessary personal data. Refer to approved secret names,
not secret values.

## License

The schema, example, validator, and documentation are available under the MIT
License.
