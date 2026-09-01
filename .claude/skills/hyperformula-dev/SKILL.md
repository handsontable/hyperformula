---
name: hyperformula-dev
paths: hyperformula/src/**
description: >
  Use for ANY work touching the HyperFormula engine in `hyperformula/src/`: fixing bugs, adding features,
  changing the public API, working on the parser, the interpreter, the dependency graph,
  CRUD operations, configuration options, named expressions, or number and date formats.
  Also use for how-to questions about engine internals (how recalculation works, why a formula
  returns an error, where a value is coerced). Triggers on file paths under `hyperformula/src/`, or when the
  user describes a symptom in a calculation without naming a file. This is the primary entry
  point for engine development — when in doubt, load it.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`ARCHITECTURE.md`](../../../hyperformula/dev-docs/ARCHITECTURE.md) | The pipeline, the core modules, and the invariants that hold everywhere in `hyperformula/src/` |
| [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md) | Style, and which paths are hot enough that complexity matters |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

Then the page for the stage you are changing:

| File | For |
|---|---|
| [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md) | `hyperformula/src/parser/` — formula text to AST, and back |
| [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md) | `hyperformula/src/interpreter/` — AST to value, and built-in functions |
| [`DEPENDENCY-GRAPH.md`](../../../hyperformula/dev-docs/DEPENDENCY-GRAPH.md) | `hyperformula/src/DependencyGraph/` — dependency tracking and recalculation order |
| [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md) | `hyperformula/src/interpreter/functionMetadata/` — function descriptions |
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | `hyperformula/src/i18n/` — function-name translations |
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md) | Writing the test the change needs |

## 2. Locate the stage before changing anything

The engine is a pipeline: `CellContentParser` → `parser/` → `GraphBuilder` → `DependencyGraph/` → `Evaluator` → `interpreter/` → `Serialization`.

| Symptom | Stage |
|---|---|
| Does not parse, or parses wrongly | `hyperformula/src/parser/` |
| `getCellFormula` returns something the user never typed | `hyperformula/src/parser/Unparser.ts` |
| A function returns the wrong value or error | `hyperformula/src/interpreter/plugin/` — skill `hyperformula-function-dev` |
| Value right, but stale after an edit | `hyperformula/src/DependencyGraph/`, `hyperformula/src/Evaluator.ts` |
| Wrong after adding or removing rows or columns | `hyperformula/src/dependencyTransformers/`, `LazilyTransformingAstService.ts` |
| Wrong in one language only | `hyperformula/src/i18n/languages/` — skill `i18n-translations` |
| Coercion or comparison is wrong | `hyperformula/src/interpreter/ArithmeticHelper.ts` |
| The public API disagrees with its docs | `hyperformula/src/HyperFormula.ts` |

A bug that looks like an interpreter problem is often a parser or graph problem. Confirm which before editing. Use the `typescript-lsp` plugin to find a definition or its callers; grep is for text, not symbols.

## 3. Reproduce first

Write the failing test before the fix and watch it fail — skill `test-writing-discipline`. For a calculation bug the smallest reproduction is a two-line `buildFromArray` plus one `getCellValue`.

If `hyperformula/test/hyperformula-tests/` is absent, `npm run test:jest` runs only the smoke tests and reports a clean pass over almost nothing. Run `npm run test:setup-private` first, and after every branch switch.

## 4. Change, then run the fast loop

```bash
npm run test:jest -- <pattern>
npm run lint
```

Run `npm run test:performance` for changes to the evaluation or CRUD hot paths.

## 5. Finish the change

Tests, documentation, JSDoc, changelog, translations — every item of `DEFINITION-OF-DONE.md`.
