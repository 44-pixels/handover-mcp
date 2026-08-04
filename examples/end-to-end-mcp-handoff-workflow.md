# End-to-end MCP agent handoff

Use this reproducible workflow to prove that separate people or agents can
publish, review, correct, resolve, and continue the same Handover record.

The test distinguishes three properties:

1. **Connectivity:** the host can call the MCP server.
2. **Workflow completion:** an authenticated actor creates a retrievable
   revision with intact source files.
3. **Continuity:** a different authenticated actor can inspect, review, and
   continue the canonical record without the original chat.

## Prerequisites

- Connect each host to `https://handover.sh/api/mcp?profile=core`.
- Use a separate human sign-in or named service credential for every actor.
- Give Principal A and Principal B access to the same workspace.
- Keep Principal D outside that workspace for the denied-access check.
- Never put credentials, hidden reasoning, or unrelated personal data into a
  handover artifact.

Use a unique marker so the test cannot collide with an earlier run:

```text
e2e-mcp-handoff-YYYYMMDD-HHMMSS
```

Save every returned `hov_`, `rev_`, `art_`, `cmt_`, and `prn_` identifier. Do
not invent identifiers or copy them from this example.

## Actors

| Principal | Job | Required access |
| --- | --- | --- |
| Principal A | Publish the initial work | Read and write |
| Principal B | Review exact evidence | Read and annotate |
| Principal C | Correct or continue the work | Read and write |
| Principal D | Prove the denied path | No workspace access |

Principal A and Principal C may be the same identity, but Principal B must be a
different authenticated identity for the continuity proof.

## 1. Verify Principal A

Call:

```json
{
  "tool": "handover.whoami",
  "arguments": {}
}
```

Record the server-resolved principal, organization, workspace, role, and
scopes. Stop if the identity or workspace is not the intended one.

Authorship comes from the accepted credential. A prompt-provided author name
does not change it.

## 2. Search before creating

```json
{
  "tool": "handover.search",
  "arguments": {
    "query": "e2e-mcp-handoff-YYYYMMDD-HHMMSS",
    "mode": "lexical",
    "status": "active",
    "limit": 10
  }
}
```

Create a new record only when the unique marker is absent. For a real workflow,
continue the existing canonical record instead of creating a duplicate.

## 3. Publish the source package

Principal A calls `handover.create`:

```json
{
  "tool": "handover.create",
  "arguments": {
    "title": "End-to-end MCP handoff e2e-mcp-handoff-YYYYMMDD-HHMMSS",
    "summary": "A multi-file continuity test with review and correction.",
    "note": "Published the initial analysis package for independent review.",
    "brief": {
      "objective": "Verify that another authenticated actor can review, correct, and continue this analysis.",
      "currentState": "Initial analysis published; denominator logic needs independent review.",
      "decisions": [
        "Preserve Markdown, SQL, and JSON as separate source artifacts.",
        "Require a later immutable revision for any correction."
      ],
      "openQuestions": [
        "Should cancelled trials be included in trial_count?"
      ],
      "nextSteps": [
        {
          "id": "step_review_denominator",
          "text": "Review the SQL denominator and evidence claim.",
          "status": "open"
        }
      ]
    },
    "artifacts": [
      {
        "name": "context.md",
        "mediaType": "text/markdown",
        "content": "# Trial conversion handoff\n\nMarker: e2e-mcp-handoff-YYYYMMDD-HHMMSS\n\n## Current state\n\nThe initial query counts every trial row. The denominator needs independent review.\n\n## Next action\n\nReview `query.sql` and correct the claim if cancelled trials should be excluded.\n"
      },
      {
        "name": "query.sql",
        "mediaType": "application/sql",
        "content": "SELECT\n  COUNT(*) AS trial_count,\n  SUM(converted) AS converted_count,\n  SAFE_DIVIDE(SUM(converted), COUNT(*)) AS conversion_rate\nFROM analytics.trials;\n"
      },
      {
        "name": "evidence.json",
        "mediaType": "application/json",
        "content": "{\n  \"marker\": \"e2e-mcp-handoff-YYYYMMDD-HHMMSS\",\n  \"claim\": \"All trial rows are currently included in the denominator.\",\n  \"verification\": \"pending\",\n  \"source\": \"analytics.trials\"\n}\n"
      }
    ]
  }
}
```

Record:

- `handoverId`
- `currentRevisionId`
- the three artifact IDs

## 4. Read the publication back

Principal A calls:

```json
{
  "tool": "handover.get",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE"
  }
}
```

Then call `handover.read_artifact` once for each returned artifact ID:

```json
{
  "tool": "handover.read_artifact",
  "arguments": {
    "artifactId": "art_RETURNED_BY_GET",
    "maxBytes": 524288
  }
}
```

Verify:

- all three names and media types are present;
- the returned content contains the unique marker;
- `truncated` is `false`;
- the SQL and JSON match the submitted source.

A successful create response without this read-back is not a completed
publication test.

## 5. Verify Principal B independently

In a different authenticated session or host, Principal B calls:

```json
{
  "tool": "handover.whoami",
  "arguments": {}
}
```

The returned principal ID must differ from Principal A. Record Principal B's
identity and confirm the expected workspace.

## 6. Retrieve the exact revision and artifacts

Principal B calls `handover.search`, then:

```json
{
  "tool": "handover.get",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "revisionId": "rev_INITIAL"
  }
}
```

Read `query.sql` and `evidence.json` with `handover.read_artifact`. The reviewer
must inspect the immutable source before commenting.

## 7. Anchor and assign the finding

Use offsets calculated from the exact `query.sql` content returned by
`handover.read_artifact`. The values below match the sample SQL only.

```json
{
  "tool": "handover.annotate",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "body": "The denominator must exclude cancelled trials. Correct the SQL and update evidence.json before resolving this finding.",
    "target": {
      "revisionId": "rev_INITIAL",
      "artifactId": "art_QUERY_SQL",
      "targetKind": "text",
      "selector": {
        "exact": "COUNT(*) AS trial_count",
        "prefix": "SELECT\n  ",
        "suffix": ",\n  SUM(converted)",
        "startOffset": 9,
        "endOffset": 32
      }
    },
    "mentionPrincipalIds": [
      "prn_AUTHORIZED_RESOLVER"
    ]
  }
}
```

Record the returned `commentId`. Mentions notify authorized collaborators; they
do not grant access.

Optionally set the open owner:

```json
{
  "tool": "handover.assign",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "principalIds": [
      "prn_AUTHORIZED_RESOLVER"
    ]
  }
}
```

Confirm the finding is open:

```json
{
  "tool": "handover.annotations",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "artifactId": "art_QUERY_SQL",
    "revisionId": "rev_INITIAL",
    "status": "open"
  }
}
```

## 8. Publish the correction

Principal C first calls `handover.whoami` and `handover.get`. Use the current
revision returned by that read as `expectedRevisionId`.

```json
{
  "tool": "handover.continue",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "expectedRevisionId": "rev_INITIAL",
    "note": "Excluded cancelled trials from the denominator and updated the evidence claim.",
    "brief": {
      "objective": "Verify that another authenticated actor can review, correct, and continue this analysis.",
      "currentState": "Denominator corrected and ready for reviewer verification.",
      "decisions": [
        "Exclude status = cancelled from trial_count.",
        "Preserve the original reviewed revision and publish the correction as a new revision."
      ],
      "openQuestions": [],
      "nextSteps": [
        {
          "id": "step_review_denominator",
          "text": "Review the SQL denominator and evidence claim.",
          "status": "done"
        },
        {
          "id": "step_successor_continue",
          "text": "Use the corrected query in the next analysis run.",
          "status": "open"
        }
      ]
    },
    "artifacts": [
      {
        "name": "query.sql",
        "mediaType": "application/sql",
        "content": "SELECT\n  COUNTIF(status != 'cancelled') AS trial_count,\n  SUM(IF(status != 'cancelled', converted, 0)) AS converted_count,\n  SAFE_DIVIDE(\n    SUM(IF(status != 'cancelled', converted, 0)),\n    COUNTIF(status != 'cancelled')\n  ) AS conversion_rate\nFROM analytics.trials;\n"
      },
      {
        "name": "evidence.json",
        "mediaType": "application/json",
        "content": "{\n  \"marker\": \"e2e-mcp-handoff-YYYYMMDD-HHMMSS\",\n  \"claim\": \"Cancelled trials are excluded from the conversion denominator.\",\n  \"verification\": \"corrected\",\n  \"source\": \"analytics.trials\",\n  \"filter\": \"status != cancelled\"\n}\n"
      }
    ]
  }
}
```

Omitted artifacts are inherited, so `context.md` remains in the new revision.
Matching artifact names are replaced. Record the new `currentRevisionId`.

## 9. Verify and resolve the finding

Principal B retrieves the new revision, reads the corrected `query.sql` and
`evidence.json`, then resolves the original annotation:

```json
{
  "tool": "handover.update_comment",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "commentId": "cmt_RETURNED_BY_ANNOTATE",
    "status": "resolved",
    "resolvedRevisionId": "rev_CORRECTED"
  }
}
```

Verify with:

```json
{
  "tool": "handover.annotations",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "status": "resolved"
  }
}
```

The annotation must still reference `rev_INITIAL` and `art_QUERY_SQL`, while
its resolution must reference `rev_CORRECTED`.

## 10. Prove successor continuity

In a fresh session without the original conversation, ask the successor to:

1. call `handover.whoami`;
2. search using the unique marker;
3. call `handover.get` without a revision ID;
4. read open annotations;
5. read the corrected SQL and evidence;
6. state the objective, current revision, decision, and next action;
7. continue only if new work is actually performed.

The successor should report:

- the corrected revision as current;
- cancelled trials are excluded;
- the review finding is resolved against the corrected revision;
- the next action is to use the corrected query in the next analysis run.

## Required negative tests

### Denied identity

Principal D calls `handover.whoami`, then searches for the marker and attempts
`handover.get` using the known handover ID. The protected record must not be
revealed. Do not add Principal D merely to make the test pass.

### Read-only identity

With a named `handover:read` credential, confirm `handover.get` succeeds and
`handover.continue` or `handover.annotate` returns an authorization error.

### Stale revision

After `rev_CORRECTED` exists, retry:

```json
{
  "tool": "handover.continue",
  "arguments": {
    "handoverId": "hov_RETURNED_BY_CREATE",
    "expectedRevisionId": "rev_INITIAL",
    "note": "This write should be rejected as stale."
  }
}
```

The call must fail with a revision conflict. The actor must reread the current
snapshot before attempting a legitimate continuation.

### Revoked credential

Revoke a test service credential through the owner interface, then repeat one
protected read. The call must fail without logging or returning the credential.

## Pass criteria

- [ ] Principal A and Principal B have distinct server-resolved identities.
- [ ] Search before create found no duplicate marker.
- [ ] Markdown, SQL, and JSON round-trip without truncation.
- [ ] Principal B can retrieve the exact initial revision without the original
      chat.
- [ ] The finding is anchored to the initial SQL artifact and revision.
- [ ] The correction is a later immutable revision.
- [ ] The original revision remains inspectable.
- [ ] Resolution links to the corrected revision.
- [ ] The successor states the objective, current revision, corrected decision,
      and next action accurately.
- [ ] An unauthorized identity cannot retrieve the record.
- [ ] A read-only identity cannot write.
- [ ] A stale continuation is rejected.
- [ ] A revoked credential no longer authorizes protected reads.
- [ ] No artifact, output, or log contains a credential.

## Cleanup and lifecycle

Use a dedicated test workspace or clearly mark the record as an integration
test. Archive it after evidence has been retained for the intended review
window. Do not delete a useful audit trail merely to keep the active list tidy.

## References

- Guide:
  https://handover.sh/guides/end-to-end-mcp-agent-handoff
- Connect MCP:
  https://handover.sh/install
- Handover Agent Skills:
  https://skills.handover.sh/
- MCP architecture:
  https://modelcontextprotocol.io/docs/learn/architecture
- MCP tools:
  https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP authorization:
  https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
