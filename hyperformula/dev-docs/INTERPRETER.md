# The interpreter

`hyperformula/src/interpreter/` evaluates an AST node against an `InterpreterState` and returns an `InterpreterValue`.

## The pieces

| File | Role |
|---|---|
| `Interpreter.ts` | Dispatches on AST node type. |
| `FunctionRegistry.ts` | Maps a function id to the plugin that implements it. Custom functions register here too, and may override a built-in id. |
| `InterpreterValue.ts` | The value types the engine passes around, including `CellError` and the extended number subtypes. |
| `InterpreterState.ts` | Evaluation context: the address being evaluated and the array-arithmetic flag. |
| `ArithmeticHelper.ts` | Coercion, comparison, and the arithmetic operators. |
| `Criterion.ts`, `CriterionFunctionCompute.ts` | The `*IF` / `*IFS` criterion machinery. |
| `binarySearch.ts` | Shared search used by the lookup functions. |
| `plugin/` | Every built-in function. |
| `functionMetadata/` | Their human-readable descriptions. See [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md). |

## Rules

- **Coerce through `ArithmeticHelper`.** Never write ad-hoc string-to-number or value-to-boolean conversion inside a function; the coercion rules are spreadsheet semantics, not JavaScript semantics, and they are already implemented once.
- **Errors are values.** Return a `CellError` with a message from `hyperformula/src/error-message.ts`. Do not throw: a thrown error escapes the evaluation of one cell and takes the recalculation with it.
- **The registry is keyed by id, not by implementation.** A custom plugin can be registered over a built-in id. Do not assume the plugin you are reading is the one that will answer for that id at run time.
- **This is the hot path.** `Interpreter.evaluateAst` runs once per formula, and once per cell for array-broadcast arguments. Allocation inside a per-cell loop is measurable.

## Built-in functions

Every built-in function lives in a plugin class under `hyperformula/src/interpreter/plugin/` extending `FunctionPlugin`. One file per plugin; a plugin holds one function or a family of related ones.

```ts
export class AbsPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AbsPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'ABS': {
      method: 'abs',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ]
    },
  }

  public abs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ABS'), Math.abs)
  }
}
```

`implementedFunctions` maps the **canonical English id** to its metadata — translated names never appear here. `method` names the class method that implements it, and `FunctionPluginTypecheck` makes a mismatch a compile error.

### `runFunction` does the work

Pass the raw args, the state, `this.metadata('ID')`, and a plain implementation function. `runFunction` handles argument evaluation, arity checking, coercion to the declared `argumentType`, range vectorization, and argument broadcasting. **Write the implementation as if it received already-coerced scalars** — re-checking types inside it is a sign the metadata is wrong.

`runFunctionWithReferenceArgument` is the variant for functions that take a reference rather than a value (`ROW`, `COLUMN`, `SHEET`, `ISFORMULA`). It takes a no-argument, a reference, and a non-reference callback.

### Argument metadata

| Field | Meaning |
|---|---|
| `argumentType` | `NUMBER`, `STRING`, `BOOLEAN`, `SCALAR`, `NOERROR`, `RANGE`, `ANY`, `INTEGER`, `COMPLEX` |
| `optionalArg` | The argument may be omitted |
| `defaultValue` | Value used when omitted |
| `minValue`, `maxValue`, `lessThan`, `greaterThan` | Range constraints, enforced during coercion |
| `passSubtype` | Keep the extended number subtype instead of unwrapping to a raw number |

### Function-level metadata

| Field | Set it when |
|---|---|
| `repeatLastArgs` | The function is variadic — how many trailing arguments repeat |
| `expandRanges` | Range arguments should be inlined into scalar arguments |
| `isVolatile` | It must recalculate every time (`RAND`, `NOW`) |
| `isDependentOnSheetStructureChange` | It must recalculate when rows or columns are added or removed |
| `doesNotNeedArgumentsToBeComputed` | Reference and range arguments create no dependency |
| `vectorizationForbidden` | It returns an array, or is otherwise special |
| `sizeOfResultArrayMethod` | **Required** for any function that can return an array |
| `returnNumberType` | The result is a percent, currency, date, or time |

### Never

- **Never throw.** Return a `CellError` with a message from `hyperformula/src/error-message.ts`.
- **Never hand-roll coercion.** Declare the `argumentType` and let `runFunction` coerce, or use `ArithmeticHelper`.
- **Never describe Excel's behaviour when HyperFormula deviates.** Implement what is specified, then record the deviation in [`docs/guide/list-of-differences.md`](../../docs/guide/list-of-differences.md).
- **Never allocate inside a per-cell loop** when the value can be hoisted.

### The five places a function change must touch

All five, or the failure is silent:

1. the plugin implementation in `hyperformula/src/interpreter/plugin/`;
2. its `implementedFunctions` metadata;
3. the catalogue entry in `hyperformula/src/interpreter/functionMetadata/categories/` — see [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md);
4. **every** language file in `hyperformula/src/i18n/languages/` — see [`I18N.md`](I18N.md);
5. tests — see [`TESTING.md`](TESTING.md).

Skill: `hyperformula-function-dev`.
