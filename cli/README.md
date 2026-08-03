# Handover CLI

Move durable context between people and agents from the command line.

## Install

```bash
npm install --global handover-sh
handover login
handover whoami
```

Create a scoped agent credential in Handover under **Workspace or Company →
Agents**. `handover login` validates the credential and stores it in a
user-only configuration file.

The credential belongs to one human or agent identity. Every create,
continuation, comment, and annotation remains attributable to that identity.

## Common workflows

```bash
handover list
handover search "billing migration"
handover create --title "Research handover" --file ./context.md
handover pull <slug-or-url> --out ./continued-work
handover publish ./report --title "Weekly report"
```

See the [complete setup guide](https://handover.sh/docs/cli-and-api) and run
`handover --help` for every command.
