# `src/interpreter/plugin/` — built-in functions

Every built-in spreadsheet function lives in a plugin class extending `FunctionPlugin`. One file per plugin; a plugin holds one function or a family of related ones.

## The shape

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

- `implementedFunctions` maps the **canonical English id** to its metadata. Translated names never appear here.
- `method` names the class method that implements it. `FunctionPluginTypecheck` makes a mismatch a compile error.
- The method takes `(ast: ProcedureAst, state: InterpreterState)` and delegates to `runFunction`.

## `runFunction` does the work

Pass the raw args, the state, `this.metadata('ID')`, and a plain implementation function. `runFunction` then handles argument evaluation, arity checking, coercion to the declared `argumentType`, range vectorization, and argument broadcasting. **Write the implementation as if it received already-coerced scalars** — do not re-check types inside it.

`runFunctionWithReferenceArgument` is the variant for functions that take a reference rather than a value (`ROW`, `COLUMN`, `SHEET`, `ISFORMULA`). It takes three callbacks: no-argument, reference, and non-reference.

## Argument metadata

| Field | Meaning |
|---|---|
| `argumentType` | `NUMBER`, `STRING`, `BOOLEAN`, `SCALAR`, `NOERROR`, `RANGE`, `ANY`, `INTEGER`, `COMPLEX` |
| `optionalArg` | The argument may be omitted |
| `defaultValue` | Value used when omitted |
| `minValue`, `maxValue`, `lessThan`, `greaterThan` | Range constraints, enforced during coercion |
| `passSubtype` | Keep the extended number subtype instead of unwrapping to a raw number |

Function-level metadata worth knowing:

| Field | Meaning |
|---|---|
| `repeatLastArgs` | How many trailing arguments repeat indefinitely (variadic functions) |
| `expandRanges` | Inline range arguments into scalar arguments |
| `isVolatile` | Recalculate on every recalculation (`RAND`, `NOW`) |
| `isDependentOnSheetStructureChange` | Recalculate when rows or columns are added or removed |
| `doesNotNeedArgumentsToBeComputed` | Reference and range arguments create no dependency |
| `vectorizationForbidden` | Never vectorize — array-output and special functions |
| `sizeOfResultArrayMethod` | Names the method predicting the result array size; required for any function that can return an array |
| `returnNumberType` | Pack the returned number into this subtype (percent, currency, date, time) |

## Never

- **Never throw.** Return a `CellError` with a message from `error-message.ts`. A throw escapes one cell's evaluation and takes the whole recalculation with it.
- **Never hand-roll coercion.** Declare the `argumentType` and let `runFunction` coerce, or use `ArithmeticHelper`.
- **Never describe Excel's behaviour when HyperFormula deviates.** Implement what is specified, then record the deviation in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md).
- **Never allocate inside a per-cell loop** when the value can be hoisted. These methods run once per cell for broadcast arguments.

## Checklist for a new or changed function

1. Implement or modify the plugin here, with `implementedFunctions` metadata.
2. Add or update the catalogue entry in [`../functionMetadata/categories/`](../functionMetadata/AGENTS.md) — parameter **count and names must match** `implementedFunctions`, or the authored descriptions are silently discarded.
3. Add translations for **every** language in [`../../i18n/languages/`](../../i18n/AGENTS.md).
4. Add tests in `test/`, including boundary values, wrong argument types, and error propagation.
5. If the function can return an array, declare `sizeOfResultArrayMethod` and implement it.
6. If it takes an optional or zero-argument form that arity alone does not express, declare `optionalArg: true` explicitly — nothing cross-checks this.

Skill: `hyperformula-function-dev`. Reference: [`dev-docs/FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md).
