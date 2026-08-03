# Releasing the Handover CLI

The public `44-pixels/handover-mcp` repository is the only npm publisher for
`handover-sh`. This keeps the package source, release workflow, and npm
provenance inspectable in one place.

## One-time bootstrap

The first npm release creates the package. npm requires either:

- an interactive publish with account 2FA; or
- a granular access token that can create public packages and bypasses 2FA.

Add that bootstrap credential as the `NPM_TOKEN` repository secret, run the
**Publish Handover CLI** workflow manually, then verify:

```bash
npm view handover-sh version
npm install --global handover-sh
handover --version
handover --help
```

Do not put the token in a file, issue, workflow input, shell history, or
handover artifact.

## Configure trusted publishing

After the package exists, configure its npm trusted publisher:

- Provider: GitHub Actions
- Organization: `44-pixels`
- Repository: `handover-mcp`
- Workflow filename: `publish-cli.yml`
- Allowed action: `npm publish`

The workflow uses a GitHub-hosted runner, grants `id-token: write`, and installs
an npm CLI version that supports trusted publishing. Once one trusted publish
succeeds, delete the `NPM_TOKEN` repository secret and set package publishing
access to require 2FA while disallowing traditional tokens.

## Release a version

1. Update `cli/package.json`.
2. Confirm `cli/handover.mjs` is the reviewed build intended for release.
3. Run `npm test --prefix cli` and `npm pack --dry-run ./cli`.
4. Commit and push the package source.
5. Tag the exact commit as `cli-v<version>` and push the tag.
6. Verify the workflow, npm package page, provenance, and a clean global
   install.

Never republish a mutable version. Increment the version for every release.
