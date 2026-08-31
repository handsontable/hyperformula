# `src/` — the engine

Everything here ships. It is TypeScript, it runs in the browser and in Node, and it is on the hot path of a calculation engine.

## Never

- **No DOM, no network, no filesystem.** The engine is headless. A dependency that reaches for `window`, `document`, or `fs` does not belong in `src/`.
- **No English function names hard-coded** in the parser or the interpreter. Function names are translated; the lexer builds its token set from the active language package. See [`i18n/AGENTS.md`](i18n/AGENTS.md).
- **No full recalculation.** A change recalculates the affected subgraph. Anything that forces the engine to walk every cell is a performance regression, not an implementation detail.
- **No breaking change to the public API** without a migration-guide section and an explicit note in the pull request. The public surface is `HyperFormula.ts` and the types it exports.

## Always

- JSDoc on every class and function. The JSDoc on `HyperFormula.ts` **is** the published API reference — write it for the reader of the docs portal, not for yourself.
- A test in [`test/`](../test/) for every change here. A bug fix ships a test that fails against the unfixed code.
- Coercion and comparison go through `interpreter/ArithmeticHelper.ts`, not hand-rolled inside a caller.
- Think about complexity in anything that runs per cell, per formula, or per dependency-graph node. See [`dev-docs/CODE-STYLE.md`](../dev-docs/CODE-STYLE.md#performance).

## Where to look next

| Subsystem | Directory |
|---|---|
| Formula text to AST, and back | [`parser/`](parser/AGENTS.md) |
| AST to value | [`interpreter/`](interpreter/AGENTS.md) |
| Built-in spreadsheet functions | [`interpreter/plugin/`](interpreter/plugin/AGENTS.md) |
| Function descriptions for the API and the docs | [`interpreter/functionMetadata/`](interpreter/functionMetadata/AGENTS.md) |
| Dependency tracking and recalculation order | [`DependencyGraph/`](DependencyGraph/AGENTS.md) |
| Function-name translations | [`i18n/`](i18n/AGENTS.md) |

Deep reference: [`dev-docs/ARCHITECTURE.md`](../dev-docs/ARCHITECTURE.md). Skill: `hyperformula-dev`.

## Files without their own `AGENTS.md`

- `HyperFormula.ts` — the public API. Every method here is documented output.
- `CrudOperations.ts` / `Operations.ts` / `UndoRedo.ts` — CRUD validates, `Operations` mutates, `UndoRedo` records. A new mutation needs all three, or undo silently diverges.
- `Config.ts` / `ConfigParams.ts` — a new option needs a default, validation, and a guide entry.
- `dependencyTransformers/` — AST rewrites when rows, columns, or sheets move. Paired with `LazilyTransformingAstService.ts`, which defers them until a formula is read.
- `format/`, `helpers/`, `Lookup/`, `statistics/` — number and date formats, shared utilities, lookup strategies, instrumentation counters.
