---
name: hyperformula-code-review
description: Use when reviewing a diff, a branch, or a pull request in the HyperFormula repository. Covers correctness for a calculation engine, performance on the hot paths, the five places a function change must touch, API stability, and what the definition of done requires.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change was required to contain |
| [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md) | Style, and which paths are hot enough that complexity matters |
| [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour) | Whether the tests prove anything, or only execute code |

Then the page covering what the diff touches: [`ARCHITECTURE.md`](../../../hyperformula/dev-docs/ARCHITECTURE.md), [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md), [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md), [`DEPENDENCY-GRAPH.md`](../../../hyperformula/dev-docs/DEPENDENCY-GRAPH.md), [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md), [`I18N.md`](../../../hyperformula/dev-docs/I18N.md).

Review in the order below, and stop to report the first serious finding rather than burying it under style notes.

## 2. Correctness

- **Would the test fail without the fix?** Ask it of every bug-fix pull request.
- **Any `throw` reachable from evaluation**, instead of a returned `CellError`.
- **Hand-rolled coercion** instead of `ArithmeticHelper`.
- **Empty cells, empty ranges, and error arguments** — the most common gap in a function change.
- **A parser change without a matching `Unparser` change.**
- **A structural change that does not assert the formula text afterwards.**
- **A new mutation missing one of `CrudOperations`, `Operations`, `UndoRedo`** — undo diverges silently.

## 3. Completeness of a function change

Check every one of [the five places a function change must touch](../../../hyperformula/dev-docs/INTERPRETER.md#the-five-places-a-function-change-must-touch); most of them fail silently when missed. Plus `sizeOfResultArrayMethod` for anything array-returning, and an explicit `optionalArg` where arity does not express the valid call. Skill `hyperformula-function-dev`.

## 4. Performance

Allocation in a per-cell or per-vertex loop; work that could be hoisted out of the broadcast path; a range expanded into per-cell iteration; anything that widens what a change invalidates; a `ParserWithCaching` change that makes the result depend on something outside the cache key. Ask for `npm run test:performance` on hot-path changes.

## 5. Public API

`hyperformula/src/HyperFormula.ts` and its exported types are the contract. A signature, return-type, or behaviour change is breaking and needs a migration-guide section and an explicit note. JSDoc here is published output — review it as documentation.

## 6. Process

One atomic change per pull request. Say so when unrelated refactors have been folded in, rather than approving them through.

## 7. Style, last and briefly

ESLint owns formatting. Comment only on what it cannot check: a misleading name, a function doing two things, duplicated logic an existing helper already covers.

## Reporting

One line per finding: what is wrong, where, and what to do instead. No praise, no summary of what the pull request does. Separate "this is a bug" from "I would have done it differently", and never present the second as the first.
