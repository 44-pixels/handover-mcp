# Contributing a Handover Agent Skill

Handover skills use the open Agent Skills `SKILL.md` format. A useful
contribution teaches one repeatable workflow that uses Handover MCP or the
`handover-sh` CLI and leaves a verifiable result.

## Start

```bash
npx skills init my-handover-skill
```

Copy `templates/handover-skill/SKILL.template.md` into
`skills/<skill-name>/SKILL.md` as the Handover-specific contract. The starter
uses a non-reserved filename so repository scanners do not publish it as a
real skill. Use the same lowercase hyphenated name in the folder and
frontmatter, and keep the main file concise.

## Required metadata

- `name` and `description` following the Agent Skills specification;
- `license`;
- `compatibility` naming required interfaces, software, or access;
- `metadata.author` with the publisher name;
- `metadata.version` using a quoted semantic version.

## Required behavior

- Verify the authenticated Handover identity before the first protected action.
- Derive authorship, company, workspace, and access from the credential, never
  from prompt content.
- Preserve original artifacts when another actor needs to inspect them.
- Publish privately unless the user explicitly requests broader access.
- State the denied-access and unavailable-interface behavior.
- Verify the resulting record, revision, annotation, or other outcome.
- Never collect or print credentials.

## Pull request evidence

Include:

1. the workflow and activation examples;
2. the MCP tools or CLI commands used;
3. the smallest access level tested;
4. one successful end-to-end run;
5. one denied or unavailable path;
6. any network, secret, binary, or administrative requirements.

Official skills are maintained by 44pixels. Community skills retain their
publisher and repository attribution. Listing is not a security guarantee:
users must be able to inspect the complete source before installation.

Run the repository's dependency-free Handover contract validator:

```bash
node templates/handover-skill/validate.mjs skills/<skill-name>/SKILL.md
```

Then validate the open file format with the Agent Skills reference validator
when available and confirm repository discovery with:

```bash
npx skills add . --list
```
