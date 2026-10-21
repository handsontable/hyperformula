# `hyperformula-ui/`

UI components for HyperFormula. Today that is one published package, [`hyperformula-ui`](packages/core/README.md): a formula editor with syntax and reference highlighting, function autocomplete and help, and a formula bar, for any grid.

| Directory | What it is | Published |
|---|---|---|
| [`packages/core/`](packages/core/) | The `hyperformula-ui` package | Yes, to npm |
| [`demo/`](demo/) | An editor-only demo page, run with `npm run dev:ui` | No |
| [`e2e/`](e2e/) | A Playwright smoke test against the demo | No |
| [`dev-docs/`](dev-docs/README.md) | Architecture, code style, tests and the release procedure | No |

Run everything from the repository root after `npm ci`; the commands are in [`dev-docs/SPEC.md`](dev-docs/SPEC.md#12-build--commands).

The code was imported from the formula-builder repository at commit `e85b52b`, without its history. Grid integrations live outside this repository: Handsontable ships its own, as a built-in plugin.

The packages version on their own `0.x` line, with their own [`CHANGELOG.md`](CHANGELOG.md), until they join the engine's version.
