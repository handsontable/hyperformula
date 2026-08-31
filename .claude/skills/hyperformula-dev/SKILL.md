---
name: hyperformula-dev
paths: src/**
description: >
  Use for ANY work touching the HyperFormula engine in `src/`: fixing bugs, adding features,
  changing the public API, working on the parser, the interpreter, the dependency graph,
  CRUD operations, configuration options, named expressions, or number and date formats.
  Also use for how-to questions about engine internals (how recalculation works, why a formula
  returns an error, where a value is coerced). Triggers on file paths under `src/`, or when the
  user describes a symptom in a calculation without naming a file. This is the primary entry
  point for engine development — when in doubt, load it.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`ARCHITECTURE.md`](../../../dev-docs/ARCHITECTURE.md) | The pipeline, the core modules, and the invariants that hold everywhere in `src/` |
| [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md) | Style, and which paths are hot enough that complexity matters |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

Then the page for the stage you are changing:

| File | For |
|---|---|
| [`PARSER.md`](../../../dev-docs/PARSER.md) | `src/parser/` — formula text to AST, and back |
| [`INTERPRETER.md`](../../../dev-docs/INTERPRETER.md) | `src/interpreter/` — AST to value, and built-in functions |
| [`DEPENDENCY-GRAPH.md`](../../../dev-docs/DEPENDENCY-GRAPH.md) | `src/DependencyGraph/` — dependency tracking and recalculation order |
| [`FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md) | `src/interpreter/functionMetadata/` — function descriptions |
| [`I18N.md`](../../../dev-docs/I18N.md) | `src/i18n/` — function-name translations |
| [`TESTING.md`](../../../dev-docs/TESTING.md) | Writing the test the change needs |

## 2. Locate the stage before changing anything

The engine is a pipeline: `CellContentParser` → `parser/` → `GraphBuilder` → `DependencyGraph/` → `Evaluator` → `interpreter/` → `Serialization`.

| Symptom | Stage |
|---|---|
| Does not parse, or parses wrongly | `src/parser/` |
| `getCellFormula` returns something the user never typed | `src/parser/Unparser.ts` |
| A function returns the wrong value or error | `src/interpreter/plugin/` — skill `hyperformula-function-dev` |
| Value right, but stale after an edit | `src/DependencyGraph/`, `src/Evaluator.ts` |
| Wrong after adding or removing rows or columns | `src/dependencyTransformers/`, `LazilyTransformingAstService.ts` |
| Wrong in one language only | `src/i18n/languages/` — skill `i18n-translations` |
| Coercion or comparison is wrong | `src/interpreter/ArithmeticHelper.ts` |
| The public API disagrees with its docs | `src/HyperFormula.ts` |

A bug that looks like an interpreter problem is often a parser or graph problem. Confirm which before editing. Use the `typescript-lsp` plugin to find a definition or its callers; grep is for text, not symbols.

## 3. Reproduce first

Write the failing test before the fix and watch it fail — skill `test-writing-discipline`. For a calculation bug the smallest reproduction is a two-line `buildFromArray` plus one `getCellValue`.

If `test/hyperformula-tests/` is absent, `npm run test:jest` runs only the smoke tests and reports a clean pass over almost nothing. Run `npm run test:setup-private` first, and after every branch switch.

## 4. Change, then run the fast loop

```bash
npm run test:jest -- <pattern>
npm run lint
```

Run `npm run test:performance` for changes to the evaluation or CRUD hot paths.

## 5. Finish the change

Tests, documentation, JSDoc, changelog, translations — every item of `DEFINITION-OF-DONE.md`.
