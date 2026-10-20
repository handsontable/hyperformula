# Reviewing an engine change

What to look for in each category of the [review order](../../dev-docs/CODE-REVIEW.md#review-order) when a diff touches `hyperformula/src/`.

## Correctness

- **Any `throw` reachable from evaluation**, instead of a returned `CellError` — see [`INTERPRETER.md`](INTERPRETER.md#rules).
- **Hand-rolled coercion** instead of `ArithmeticHelper`.
- **Arguments not handled the way Excel handles them** — empty cells, empty ranges and error arguments are the most common gap in a function change; see [`EXCEL-COMPATIBILITY.md`](EXCEL-COMPATIBILITY.md#arguments).
- **A parser change without a matching `Unparser` change** — see [`ARCHITECTURE.md`](ARCHITECTURE.md#the-parser).
- **A structural change whose tests do not assert the formula text afterwards** — see [`TESTING.md`](TESTING.md#what-each-kind-of-change-needs).
- **A new mutation missing one of `CrudOperations`, `Operations`, `UndoRedo`** — undo diverges silently.

## Completeness of a function change

Every one of [the six places a function change must touch](INTERPRETER.md#the-six-places-a-function-change-must-touch); most of them fail silently when missed. Plus `sizeOfResultArrayMethod` for anything that can return an array, and an explicit `optionalArg` where arity alone does not express the valid call — see [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md#optionality-is-not-cross-checked).

## Performance

Allocation in a per-cell or per-vertex loop; work that could be hoisted out of the broadcast path; a range expanded into per-cell iteration; anything that widens what a change invalidates; a `ParserWithCaching` change that makes the result depend on something outside the cache key. Ask for `npm run test:performance` on hot-path changes — see [`PERFORMANCE.md`](PERFORMANCE.md), and weigh a proposed speed-up with its [questions](PERFORMANCE.md#weighing-a-speed-up).

## Public API

`hyperformula/src/HyperFormula.ts` and the types re-exported from `hyperformula/src/index.ts` are the contract. Every change to it follows [`PUBLIC-API.md`](PUBLIC-API.md); what counts as breaking is in [Breaking changes](../../dev-docs/DEFINITION-OF-DONE.md#breaking-changes).
