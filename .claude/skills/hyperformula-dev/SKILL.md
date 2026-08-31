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

The rules live in [`dev-docs/`](../../../dev-docs/README.md). This skill is the order of operations.

## 1. Locate the stage before changing anything

The engine is a pipeline: `CellContentParser` → `parser/` → `GraphBuilder` → `DependencyGraph/` → `Evaluator` → `interpreter/` → `Serialization`.

| Symptom | Stage | Read |
|---|---|---|
| Does not parse, or parses wrongly | `src/parser/` | [`PARSER.md`](../../../dev-docs/PARSER.md) |
| `getCellFormula` returns something the user never typed | `src/parser/Unparser.ts` | [`PARSER.md`](../../../dev-docs/PARSER.md) |
| A function returns the wrong value or error | `src/interpreter/plugin/` | skill `hyperformula-function-dev` |
| Value right, but stale after an edit | `src/DependencyGraph/`, `src/Evaluator.ts` | [`DEPENDENCY-GRAPH.md`](../../../dev-docs/DEPENDENCY-GRAPH.md) |
| Wrong after adding or removing rows or columns | `src/dependencyTransformers/`, `LazilyTransformingAstService.ts` | [`DEPENDENCY-GRAPH.md`](../../../dev-docs/DEPENDENCY-GRAPH.md) |
| Wrong in one language only | `src/i18n/languages/` | skill `i18n-translations` |
| Coercion or comparison is wrong | `src/interpreter/ArithmeticHelper.ts` | [`INTERPRETER.md`](../../../dev-docs/INTERPRETER.md) |
| The public API disagrees with its docs | `src/HyperFormula.ts` | [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md) |

A bug that looks like an interpreter problem is often a parser or graph problem. Confirm which before editing.

Use the `typescript-lsp` plugin to find a definition or its callers; grep is for text, not symbols.

## 2. Reproduce first

Write the failing test before the fix and watch it fail — skill `test-writing-discipline`. For a calculation bug the smallest reproduction is a two-line `buildFromArray` plus one `getCellValue`.

If `test/hyperformula-tests/` is absent, `npm run test:jest` runs only the smoke tests and reports a clean pass over almost nothing. Run `npm run test:setup-private` first, and after every branch switch.

## 3. Change, then run the fast loop

```bash
npm run test:jest -- <pattern>
npm run lint
```

## 4. Finish the change

Tests, documentation, JSDoc, changelog, translations: [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).

Before touching anything under `src/interpreter/`, `src/DependencyGraph/`, `src/Evaluator.ts`, `src/parser/ParserWithCaching.ts`, or `src/LazilyTransformingAstService.ts`, ask what runs per cell and what runs once — [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md#performance). Run `npm run test:performance` for changes to the evaluation or CRUD hot paths.
