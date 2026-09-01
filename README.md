# HyperFormula monorepo

[HyperFormula](https://hyperformula.handsontable.com/) is a headless spreadsheet calculation engine in TypeScript. It parses formulas, tracks cell dependencies, and recalculates incrementally, in the browser and in Node.

This repository holds the engine and everything built around it.

| Directory | What it is | Published |
|---|---|---|
| [`hyperformula/`](hyperformula/) | The calculation engine. **Start here** — its [README](dev-docs/README.md) is the product documentation. | yes |
| [`hyperformula-ui/`](hyperformula-ui/) | UI components for working with HyperFormula. Not imported yet. | yes |

The published packages release together, on one version, and share the single [`CHANGELOG.md`](CHANGELOG.md) at the root.
| [`docs/`](docs/) | The documentation portal. Installed separately; not a workspace member. | no |

## Getting started

```bash
npm ci                     # installs the workspace
npm run test:setup-private # attaches the private test suite, if you have access
npm run test:jest          # the fast test loop
npm run bundle-all         # every bundle for the engine
```

Root scripts fan out to the packages; run a package's own scripts from its directory, or with `--workspace=hyperformula`.

The documentation portal installs on its own:

```bash
npm run docs:install
npm run docs:dev
```

## Contributing and development

- External contributors: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Everyone working on the source, including AI agents: [`dev-docs/README.md`](dev-docs/README.md) — architecture, build, testing, standards, and the definition of done
- AI coding agents: [`AGENTS.md`](AGENTS.md)

## Licence

GPL-3.0-only, plus a commercial licence. See [`LICENSE.txt`](LICENSE.txt).
