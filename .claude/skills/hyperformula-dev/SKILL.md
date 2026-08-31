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

## Orient first

The engine is a pipeline. Locate the stage before changing anything:

```
setCellContents → CellContentParser → parser/ → GraphBuilder → DependencyGraph/ → Evaluator → interpreter/ → Serialization
```

| Symptom | Stage | Read |
|---|---|---|
| The formula does not parse, or parses wrongly | `src/parser/` | `src/parser/AGENTS.md` |
| `getCellFormula` returns something the user did not type | `src/parser/Unparser.ts` | `src/parser/AGENTS.md` |
| A function returns the wrong value or the wrong error | `src/interpreter/plugin/` | skill `hyperformula-function-dev` |
| The value is right but stale after an edit | `src/DependencyGraph/`, `src/Evaluator.ts` | `src/DependencyGraph/AGENTS.md` |
| Wrong after adding/removing rows or columns | `src/dependencyTransformers/`, `src/LazilyTransformingAstService.ts` | `dev-docs/ARCHITECTURE.md` |
| Wrong in one language only | `src/i18n/languages/` | skill `i18n-translations` |
| Coercion or comparison is wrong | `src/interpreter/ArithmeticHelper.ts` | `src/interpreter/AGENTS.md` |
| The public API behaves differently from its docs | `src/HyperFormula.ts` | `dev-docs/DOC-STANDARDS.md` |

Use the `typescript-lsp` plugin to find a definition or its callers. Grep is for text, not for symbols.

## Non-negotiables

- **Headless.** No DOM, no network, no filesystem in `src/`.
- **Never throw from evaluation.** Return a `CellError` with a message from `src/error-message.ts`. A throw takes down the whole recalculation, not one cell.
- **Coerce through `ArithmeticHelper`.** Spreadsheet coercion is not JavaScript coercion, and it is already implemented once.
- **No English function names hard-coded** anywhere in the parser or interpreter.
- **Incremental recalculation.** Anything that forces a full recalculation is a regression.
- **JSDoc on `HyperFormula.ts` is published output.** Write it for the docs portal reader.

## Workflow

1. **Reproduce first.** Write the failing test before the fix — see skill `test-writing-discipline`. For a calculation bug, the smallest reproduction is a two-line `buildFromArray` plus one `getCellValue`.
2. **Fetch the private test suite** if it is not present: `npm run test:setup-private`. Do this after every branch switch.
3. **Change the narrowest stage** that owns the behaviour. A bug that looks like an interpreter problem is often a parser or graph problem; confirm which before editing.
4. **Run the fast loop**: `npm run test:jest`. Narrow it with `npm run test:jest -- <pattern>`.
5. **Complete the change**: tests, docs, changelog, translations. See [`dev-docs/DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).
6. **Lint**: `npm run lint`. ESLint is the source of truth for style.

## Performance

The engine is a calculation engine; production-code performance is a feature. Before changing anything under `src/interpreter/`, `src/DependencyGraph/`, `src/Evaluator.ts`, `src/parser/ParserWithCaching.ts`, or `src/LazilyTransformingAstService.ts`, ask what runs per cell and what runs once.

Run `npm run test:performance` for changes that touch evaluation or CRUD hot paths. It requires the private suite.

## Common traps

- **The parser cache keys on the formula string.** If a parse result must depend on anything else, the key must include it — otherwise the cache returns the wrong AST.
- **Ranges are one vertex.** Expanding a range into per-cell edges destroys the performance the engine exists for.
- **`EmptyCellVertex` is not "no vertex".** An empty cell someone depends on still needs one.
- **A new mutation needs `CrudOperations` (validate), `Operations` (mutate), and `UndoRedo` (record).** Miss the third and undo silently diverges.
- **A new config option needs a default in `ConfigParams.ts`, validation in `Config.ts`, and a guide entry.**

Deep reference: [`dev-docs/ARCHITECTURE.md`](../../../dev-docs/ARCHITECTURE.md).
