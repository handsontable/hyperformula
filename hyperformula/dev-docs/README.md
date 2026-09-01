# `hyperformula/dev-docs/` — the engine's internals

Reference for the `hyperformula` package: how the engine works, how it is built, and how it is tested.

Repository-wide standards — what a change must include, code style, testing standards, documentation rules, pull requests — live one level up, in [`dev-docs/`](../../dev-docs/README.md). Nothing here restates them.

## Where to look

| You are working on | Read |
|---|---|
| Anything in `src/` | [`ARCHITECTURE.md`](ARCHITECTURE.md) — the pipeline, the core modules, and the invariants that hold everywhere in `src/` |
| Formula parsing | [`PARSER.md`](PARSER.md) |
| Formula evaluation, or a built-in function | [`INTERPRETER.md`](INTERPRETER.md) |
| Function descriptions in the API and the docs | [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md) |
| Dependency tracking and recalculation order | [`DEPENDENCY-GRAPH.md`](DEPENDENCY-GRAPH.md) |
| Function-name translations | [`I18N.md`](I18N.md) |
| Anything on a hot path | [`PERFORMANCE.md`](PERFORMANCE.md) |
| The test suites, and the private one | [`TESTING.md`](TESTING.md) |
| The intermediate build and packaging | [`BUILD.md`](BUILD.md) |
