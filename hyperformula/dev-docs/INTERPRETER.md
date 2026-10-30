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
- **Evaluate each argument once.** Evaluating the same argument twice doubles its cost and, when it contains a volatile function such as `RAND`, can see two different values.
- **This is the hot path.** `Interpreter.evaluateAst` runs once per formula, and once per cell for array-broadcast arguments. Allocation inside a per-cell loop is measurable.

## Built-in functions

Every built-in function lives in a plugin class under `hyperformula/src/interpreter/plugin/` extending `FunctionPlugin`. One file per plugin; a plugin holds one function or a family of related ones. A function that works like an existing one is an alias: declare it in the plugin's static `aliases` rather than as a second implementation. It shares its target's catalogue description.

Adding a built-in function is close to adding a custom one, so the [custom functions guide](../../docs/guide/custom-functions.md) is a useful reference for the implementation patterns: argument metadata, return types, and array handling.

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

`implementedFunctions` maps the **canonical English id** to its metadata — translated names never appear here. `method` names the class method that implements it. Nothing checks that name at compile time — `FunctionPluginTypecheck` constrains only the signatures of the plugin's public members — so a mismatch throws `FunctionPluginValidationError` when the plugin is registered: for a built-in exported from `plugin/index.ts`, on import of `hyperformula/src/index.ts`; for the protected `VersionPlugin`, when an engine is built.

### `runFunction` does the work

Pass the raw args, the state, `this.metadata('ID')`, and a plain implementation function. `runFunction` handles argument evaluation, arity checking, coercion to the declared `argumentType`, range vectorization, and argument broadcasting. **Write the implementation as if it received already-coerced scalars** — re-checking types inside it is a sign the metadata is wrong.

`runFunctionWithReferenceArgument` is the variant for functions that take a reference rather than a value (`ROW`, `COLUMN`, `SHEET`, `ISFORMULA`). It takes a no-argument, a reference, and a non-reference callback.

Its optional last argument, `referenceExpected`, gives the non-reference callback a reference that a function returned, such as INDIRECT's, as a range whose cells are not read and not recorded as dependencies. `ROW` and `COLUMN` set it; set it only when the callback uses the position or the size of the range, never its values. `ROWS` and `COLUMNS` get the same through `Interpreter.evaluateReference`.

### Argument metadata

| Field | Meaning |
|---|---|
| `argumentType` | `NUMBER`, `STRING`, `BOOLEAN`, `SCALAR`, `NOERROR`, `RANGE`, `ANY`, `INTEGER`, `COMPLEX` |
| `optionalArg` | The argument may be omitted |
| `defaultValue` | Value used when omitted |
| `emptyAsDefault` | An empty argument falls back to `defaultValue` instead of the zero-value for its type; requires `defaultValue` |
| `minValue`, `maxValue`, `lessThan`, `greaterThan` | Range constraints, enforced during coercion |
| `passSubtype` | Keep the extended number subtype instead of unwrapping to a raw number |

### Function-level metadata

| Field | Set it when |
|---|---|
| `repeatLastArgs` | The function is variadic — how many trailing arguments repeat |
| `expandRanges` | Range arguments should be inlined into scalar arguments |
| `isVolatile` | It must recalculate every time (`RAND`, `NOW`) |
| `isDependentOnSheetStructureChange` | It must recalculate when the sheet structure changes: rows or columns added or removed, a sheet added, renamed, cleared or removed, a named expression added, changed or removed |
| `doesNotNeedArgumentsToBeComputed` | Reference and range arguments create no dependency |
| `vectorizationForbidden` | It returns an array, or is otherwise special |
| `enableArrayArithmeticForArguments` | Array arithmetic mode should apply to its arguments and nested expressions |
| `sizeOfResultArrayMethod` | **Required** for any function that can return an array |
| `returnNumberType` | The result is a percent, currency, date, or time |

`arrayFunction` and `arraySizeMethod` are still declared on the interface but are **deprecated since 3.1.0**, superseded by `enableArrayArithmeticForArguments` and `sizeOfResultArrayMethod`. Do not carry them forward from an older plugin.

### Never

- **Never throw.** Return a `CellError` with a message from `hyperformula/src/error-message.ts`.
- **Never hand-roll coercion.** Declare the `argumentType` and let `runFunction` coerce, or use `ArithmeticHelper`.
- **Never describe Excel's behaviour when HyperFormula deviates.** Implement what is specified, then record the deviation in [`docs/guide/list-of-differences.md`](../../docs/guide/list-of-differences.md). What the results must be, and how to check them against Excel, is in [`EXCEL-COMPATIBILITY.md`](EXCEL-COMPATIBILITY.md).
- **Never allocate inside a per-cell loop** when the value can be hoisted.
- **Never catch `EvaluationDeferred`.** A function that reads a cell found at evaluation time (INDIRECT) throws it when that cell is not current yet; the evaluator catches it, computes the cell, and retries the formula. A plugin that catches it, for example in a broad `try`/`catch`, stops the retry.

### The six places a function change must touch

This list is the authority; the skills link here rather than repeating it.

1. the plugin implementation in `hyperformula/src/interpreter/plugin/`, plus its `implementedFunctions` metadata — and a new plugin class must be exported from `hyperformula/src/interpreter/plugin/index.ts`: `hyperformula/src/index.ts` registers the built-in plugins from that module's exports (only the protected `VersionPlugin` is loaded by `FunctionRegistry` itself), so an unexported one compiles but every function in it evaluates to `#NAME?`;
2. the catalogue entry in `hyperformula/src/interpreter/functionMetadata/categories/` — see [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md);
3. the license capability table in `hyperformula/src/license/functionCapabilities.ts` — see [`LICENSING.md`](LICENSING.md#the-license-capability-table);
4. **every** language file in `hyperformula/src/i18n/languages/` — see [`I18N.md`](I18N.md);
5. tests — see [`TESTING.md`](TESTING.md);
6. the changelog entry — see [`DEFINITION-OF-DONE.md`](../../dev-docs/DEFINITION-OF-DONE.md).

They do not fail the same way. A missing catalogue entry **fails the docs build**; a parameter-count mismatch warns on the console; a missing translation makes the function evaluate to `#NAME?` in that language and drop out of `getAvailableFunctions`. The private suite catches all three (a parameter-count mismatch only when the implementation declares at least one parameter), but only when it is attached. A function missing from the capability table escapes the license check, which only the private suite catches. A missing test and a missing `optionalArg` fail silently.

### Verifying a function change

```bash
npm run test:jest -- <FunctionName>
npm run docs:install                  # once: the generator runs in the portal's own install
npm run docs:generate-function-docs   # fails loudly on a bad or missing catalogue entry
npm run lint
```

Skill: `hyperformula-function-dev`.
