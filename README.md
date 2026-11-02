# HyperFormula monorepo

[HyperFormula](https://hyperformula.handsontable.com/) is a headless spreadsheet calculation engine in TypeScript. It parses formulas, tracks cell dependencies, and recalculates incrementally, in the browser and in Node.

This repository holds the engine and everything built around it.

| Directory | What it is | Published as |
|---|---|---|
| [`hyperformula/`](hyperformula/) | The calculation engine. **Start here** — its [README](hyperformula/README.md) is the product documentation. | The [`hyperformula`](https://www.npmjs.com/package/hyperformula) package on npm: ES modules, CommonJS, UMD bundles for the browser (also served by the jsDelivr and unpkg CDNs), and TypeScript typings |
| [`hyperformula-ui/`](hyperformula-ui/) | UI components for working with HyperFormula: the formula editor package, an editor-only demo, and an end-to-end test. Its [README](hyperformula-ui/README.md) lists what is where. | The `hyperformula-ui` package on npm, once released: ES modules and TypeScript typings |
| [`docs/`](docs/) | The documentation portal. Installed separately; not a workspace member. | Not a package. Built and deployed as the documentation site at [handsontable.com/docs/hyperformula](https://handsontable.com/docs/hyperformula/) |

The engine's history is [`CHANGELOG.md`](CHANGELOG.md) at the root. The UI packages version and release on their own until they are mature, then join the engine's version — see [`dev-docs/STRUCTURE.md`](dev-docs/STRUCTURE.md#what-the-move-decided).

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

The `hyperformula` engine is GPL-3.0-only, plus a commercial licence. See [`LICENSE.txt`](LICENSE.txt).

The `hyperformula-ui` package is MIT. See [`hyperformula-ui/packages/core/LICENSE.txt`](hyperformula-ui/packages/core/LICENSE.txt).
