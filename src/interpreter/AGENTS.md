# `src/interpreter/` — AST to value

Evaluates an AST node against an `InterpreterState` and returns an `InterpreterValue`.

## The pieces

| File | Role |
|---|---|
| `Interpreter.ts` | Dispatches on AST node type. |
| `FunctionRegistry.ts` | Maps a function id to the plugin that implements it. Custom functions register here too, and may override a built-in id. |
| `InterpreterValue.ts` | The value types the engine passes around, including `CellError` and the extended number subtypes. |
| `InterpreterState.ts` | Evaluation context: the address being evaluated and the array-arithmetic flag. |
| `ArithmeticHelper.ts` | Coercion, comparison, and the arithmetic operators. |
| `Criterion.ts`, `CriterionFunctionCompute.ts` | The `*IF`/`*IFS` criterion machinery. |
| `binarySearch.ts` | Shared search used by the lookup functions. |
| `plugin/` | Every built-in function. See [`plugin/AGENTS.md`](plugin/AGENTS.md). |
| `functionMetadata/` | Human-readable descriptions of those functions. See [`functionMetadata/AGENTS.md`](functionMetadata/AGENTS.md). |

## Rules

- **Coerce through `ArithmeticHelper`.** Never write ad-hoc string-to-number or value-to-boolean conversion inside a function; the coercion rules are spreadsheet semantics, not JavaScript semantics, and they are already implemented once.
- **Errors are values.** Return a `CellError` with a message from `error-message.ts`. Do not throw: a thrown error escapes the evaluation of one cell and takes the recalculation with it.
- **The registry is keyed by id, not by implementation.** A custom plugin can be registered over a built-in id. Do not assume the plugin you are reading is the one that will answer for that id at run time.
- **This is the hot path.** `Interpreter.evaluateAst` runs once per formula, and once per cell for array-broadcast arguments. Allocation inside a per-cell loop is measurable.

Deep reference: [`dev-docs/ARCHITECTURE.md`](../../dev-docs/ARCHITECTURE.md).
