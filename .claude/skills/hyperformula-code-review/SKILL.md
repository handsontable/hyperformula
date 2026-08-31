---
name: hyperformula-code-review
description: Use when reviewing a diff, a branch, or a pull request in the HyperFormula repository. Covers correctness for a calculation engine, performance on the hot paths, the five places a function change must touch, API stability, and what the definition of done requires.
---

Review in this order, and stop to report the first serious finding rather than burying it under style notes. The rules each check enforces are in [`dev-docs/`](../../../dev-docs/README.md); this skill is what to look at, in what order.

## 1. Correctness

- **Would the test fail without the fix?** Ask it of every bug-fix pull request. See [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour).
- **Any `throw` reachable from evaluation**, instead of a returned `CellError`.
- **Hand-rolled coercion** instead of `ArithmeticHelper`.
- **Empty cells, empty ranges, and error arguments** — the most common gap in a function change.
- **A parser change without a matching `Unparser` change** — see [`PARSER.md`](../../../dev-docs/PARSER.md).
- **A structural change that does not assert the formula text afterwards** — see [`DEPENDENCY-GRAPH.md`](../../../dev-docs/DEPENDENCY-GRAPH.md).
- **A new mutation missing one of `CrudOperations`, `Operations`, `UndoRedo`** — undo diverges silently.

## 2. Completeness of a function change

All five places, and three of them fail silently: implementation, catalogue entry with a matching parameter count, every language file, tests, changelog. Plus `sizeOfResultArrayMethod` for anything array-returning, and an explicit `optionalArg` where arity does not express the valid call. See skill `hyperformula-function-dev`.

## 3. Performance

Allocation in a per-cell or per-vertex loop; work that could be hoisted out of the broadcast path; a range expanded into per-cell iteration; anything that widens what a change invalidates; a `ParserWithCaching` change that makes the result depend on something outside the cache key. Ask for `npm run test:performance` on hot-path changes. See [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md#performance).

## 4. Public API

`src/HyperFormula.ts` and its exported types are the contract. A signature, return-type, or behaviour change is breaking and needs a migration-guide section and an explicit note. JSDoc here is published output — review it as documentation.

## 5. Process

[`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md), and one atomic change per pull request. Say so when unrelated refactors have been folded in, rather than approving them through.

## 6. Style, last and briefly

ESLint owns formatting. Comment only on what it cannot check: a misleading name, a function doing two things, duplicated logic an existing helper already covers.

## Reporting

One line per finding: what is wrong, where, and what to do instead. No praise, no summary of what the pull request does. Separate "this is a bug" from "I would have done it differently", and never present the second as the first.
