# Releasing the Handover CLI

The public `44-pixels/handover-mcp` repository is the only npm publisher for
`handover-sh`. This keeps the package source, release workflow, and npm
provenance inspectable in one place.

## One-time bootstrap

Release `0.1.0` created the package on 2026-08-03. npm required either:

- an interactive publish with account 2FA; or
- a granular access token that can create public packages and bypasses 2FA.

The bootstrap release was published interactively and verified with:

```bash
npm view handover-sh version
npm install --global handover-sh
handover --version
handover --help
```

Do not add a bootstrap token to the repository. Revoke any temporary publishing
tokens after use.

## Configure trusted publishing

After the package exists, configure its npm trusted publisher:

- Provider: GitHub Actions
- Organization: `44-pixels`
- Repository: `handover-mcp`
- Workflow filename: `publish-cli.yml`
- Allowed action: `npm publish`

The workflow uses a GitHub-hosted runner, grants `id-token: write`, installs an
npm CLI version that supports trusted publishing, and does not provide a
traditional npm token. Once one trusted publish succeeds, set package
publishing access to require 2FA while disallowing traditional tokens.

## Release a version

1. Update `cli/package.json`.
2. Confirm `cli/handover.mjs` is the reviewed build intended for release.
3. Run `npm test --prefix cli` and `npm pack --dry-run ./cli`.
4. Commit and push the package source.
5. Tag the exact commit as `cli-v<version>` and push the tag.
6. Verify the workflow, npm package page, provenance, and a clean global
   install.

Never republish a mutable version. Increment the version for every release.
