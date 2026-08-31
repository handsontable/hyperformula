---
name: hyperformula-function-dev
paths: src/interpreter/**
description: Use when adding a new built-in spreadsheet function to HyperFormula, changing an existing one's signature, arguments, return type, or error behaviour, or when a function returns the wrong value or the wrong error. Covers the FunctionPlugin contract, runFunction and argument metadata, the function metadata catalogue, translations, and the full end-to-end checklist.
---

## The five places a function lives

A function is not done until all five agree. Skipping one produces a silent, specific failure:

| # | Place | Skipping it causes |
|---|---|---|
| 1 | `src/interpreter/plugin/<Name>Plugin.ts` — implementation | The function does not exist |
| 2 | `implementedFunctions` in the same file — engine metadata | The id does not resolve |
| 3 | `src/interpreter/functionMetadata/categories/<category>.ts` — catalogue entry | `npm run docs:generate-function-docs` **fails the docs build** |
| 4 | `src/i18n/languages/*.ts` — every language | The function is unparseable in that language |
| 5 | `test/` — tests | The change is not done; see the definition of done |

## 1–2. The plugin

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

The key is the **canonical English id**. `method` names the class method; `FunctionPluginTypecheck` turns a mismatch into a compile error. Put a new function in the existing plugin for its family; create a new plugin file only for a genuinely new family, and register it where the other plugins are registered.

### `runFunction` already did the work

Pass raw args, state, `this.metadata('ID')`, and a plain implementation. `runFunction` handles argument evaluation, arity checking, coercion to the declared `argumentType`, range vectorization, and broadcasting.

**Write the implementation as if it received already-coerced scalars.** Re-checking types inside it is a sign the metadata is wrong.

`runFunctionWithReferenceArgument` is the variant for reference-taking functions (`ROW`, `COLUMN`, `SHEET`, `ISFORMULA`); it takes a no-argument, a reference, and a non-reference callback.

### Argument metadata

| Field | Meaning |
|---|---|
| `argumentType` | `NUMBER`, `STRING`, `BOOLEAN`, `SCALAR`, `NOERROR`, `RANGE`, `ANY`, `INTEGER`, `COMPLEX` |
| `optionalArg` | May be omitted |
| `defaultValue` | Used when omitted |
| `minValue`, `maxValue`, `lessThan`, `greaterThan` | Enforced during coercion — use these instead of checking in the implementation |
| `passSubtype` | Keep the extended number subtype rather than unwrapping to a raw number |

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

## 3. The catalogue entry

Add the entry to `src/interpreter/functionMetadata/categories/<category>.ts`: `shortDescription`, `parameters` with `snake_case` names and descriptions, `examples`, `documentationUrl`, `category`. Every field is required.

Three ways this bites:

- **No entry** → described as `category: 'Custom'`, which has no docs section, so the docs build **fails**.
- **Parameter count disagrees with `implementedFunctions`** → the implementation wins. Authored names and descriptions are discarded, positional `Arg1`, `Arg2` are reported, and a console warning names the function. Availability is unaffected, so nothing red appears in the test run.
- **Optionality is never cross-checked.** The `optional` flag comes only from `optionalArg` / `defaultValue`. If the function accepts a call arity alone does not express, declare `optionalArg: true` explicitly.

Writing rules: refer to another argument by its exact `snake_case` name, no docs-page-local markup in `shortDescription`, and describe **HyperFormula's** behaviour rather than Excel's. Full detail: [`dev-docs/FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md).

## 4. Translations

Add the name to **every** file in `src/i18n/languages/`. Sources and rules: skill `i18n-translations`.

## 5. Tests

In `test/`. Cover, at minimum:

- the documented result for ordinary arguments;
- each boundary the metadata declares (`minValue`, `maxValue`, `lessThan`, `greaterThan`);
- wrong argument **count** — too few and too many;
- wrong argument **type**, asserting the specific `CellError`;
- error **propagation**: an argument that is itself an error;
- an empty cell and an empty range as arguments;
- if the function returns an array: the spilled shape, and the size predicted by `sizeOfResultArrayMethod`;
- if `optionalArg` is declared: the call with the argument omitted.

One assertion per case, no loops, no conditionals. See skill `hyperformula-unit-testing`.

## Verify

```bash
npm run test:jest -- <FunctionName>
npm run docs:generate-function-docs   # fails loudly on a bad or missing catalogue entry
npm run lint
```

## Deviating from Excel

HyperFormula deliberately deviates in places. If the implementation does not match Excel or Google Sheets, that is a decision — record it in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md) and say so in the changelog entry. Never write a description that documents Excel's behaviour while the code does something else.
