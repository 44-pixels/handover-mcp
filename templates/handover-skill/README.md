# Handover skill starter

Copy `SKILL.template.md` into a new `skills/<skill-name>/SKILL.md`, then replace
the placeholder name, description, publisher, and workflow instructions.

The starter intentionally is not named `SKILL.md`. Agent Skill registries scan
repositories for that reserved filename and would otherwise list this template
as an installable workflow.

Validate the finished skill against the Handover publication contract:

```bash
node templates/handover-skill/validate.mjs skills/<skill-name>/SKILL.md
```

The dependency-free validator checks Agent Skills naming and metadata, then
checks for the Handover runtime, server-resolved identity, and outcome
verification requirements. Credential safety, denied-path coverage, and access
boundaries are reported as advisories for human review. It does not connect to
MCP or prove runtime behavior; the pull request must still include a successful
end-to-end run and one denied or unavailable path.
