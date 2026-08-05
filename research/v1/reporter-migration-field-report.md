# Reporter to Handover migration field report

- Status: migration validating
- Measured: 2026-08-05
- Relationship: first-party operational evidence
- Operator: 44pixels
- Canonical report:
  https://handover.sh/case-studies/44pixels-reporter-to-handover-migration

## Finding

44pixels inventoried 1,497 Reporter source reports and verified 1,370 Handover
records. All 400 comparable file hashes matched; 127 reports remained blocked
for review.

## Verification record

| Measure | Result |
| --- | ---: |
| Source reports inventoried | 1,497 |
| Handover records verified | 1,370 |
| Comparable file hashes matched | 400 / 400 |
| Reports blocked for review | 127 |

The migration procedure inventories products, folders, reports, files, access
boundaries, and ambiguous source relationships before cutover. Comparable
files are hashed on both sides. Records without a confident mapping remain
blocked instead of being silently assigned.

## Source artifacts

- Human field report:
  https://handover.sh/case-studies/44pixels-reporter-to-handover-migration
- Agent-readable case-study index:
  https://handover.sh/case-studies.json
- Reusable migration checklist:
  https://handover.sh/examples/static-report-migration-checklist.md
- Product migration guide:
  https://handover.sh/guides/migrate-static-report-library-to-agent-workspace

## Limitations

- This is a first-party case study about one internal production corpus.
- The migration remains blocked while ambiguous and restricted records are
  reviewed.
- Digest checks prove byte equality for comparable files, not semantic
  equivalence of every report.
- The result does not estimate migration performance for unrelated systems or
  organizations.
