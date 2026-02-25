# Universal Built-in Function Implementation Workflow for HyperFormula

## Context

This is a reusable prompt template for implementing any new built-in Excel-compatible function in HyperFormula. It codifies the full lifecycle we developed during the TEXTJOIN implementation: spec research → Excel behavior validation → test-first development → implementation → verification.

The workflow is designed to be copy-pasted as a user prompt to Claude Code, with placeholders (`{FUNCTION_NAME}`, etc.) filled in for each new function.

---

## The Prompt Template

Copy everything below the line and fill in the `{PLACEHOLDERS}` before pasting to Claude Code:

---

```
Implement the built-in Excel function {FUNCTION_NAME} in HyperFormula.

Branch: feature/built-in/{FUNCTION_NAME}
Base: develop

Follow each phase in order. Do not skip ahead.

## Phase 1: Spec Research

Research {FUNCTION_NAME} thoroughly:

1. Read the official Excel spec:
   - https://support.microsoft.com/en-us/office/{FUNCTION_NAME}-function-{MS_ARTICLE_ID}
   - Document: syntax, all parameters, return type, error conditions, edge cases
2. Check Google Sheets behavior for any known divergences
3. Search HyperFormula codebase for any existing partial implementation:
   - `src/interpreter/plugin/` — check if it's already declared in a plugin's `implementedFunctions`
   - `src/i18n/languages/enGB.ts` — check if translation key exists
   - `test/` — check for any existing tests
4. Identify the target plugin file:
   - If the function fits an existing plugin category (text→TextPlugin, math→MathPlugin, etc.), add it there
   - Only create a new plugin if it doesn't fit any existing one

Produce a **spec summary** with:
- Syntax: `{FUNCTION_NAME}(arg1, arg2, ...)`
- Each parameter: name, type, required/optional, default value, accepted range
- Return type and format
- Error conditions (#VALUE!, #N/A, #REF!, etc.) and when each triggers
- Key behavioral questions that need Excel validation (mark as TBD)

## Phase 2: Excel Validation Workbook

Generate a Python script (using openpyxl) that creates an Excel validation workbook.
Output the script to the chat — do NOT add it to the repo.

The workbook must include:

### Setup Area
- Dedicated cells (e.g., J/K columns) with test fixture values
- Clear labels for each setup cell explaining what to enter
- Include: text values, numbers, empty cells (truly blank), formula empty strings (=""), booleans, error values (#N/A via =NA())

### Test Matrix
Organize tests into groups with these columns:
| # | Test Description | Formula (as text) | Expected | Actual (live formula) | Pass/Fail | Notes |

**Required test groups:**

1. **Core sanity** — basic usage matching the spec's examples
2. **Parameter edge cases** — each parameter's boundary values, optional param omission
3. **Type coercion** — numbers, booleans, empty cells, ="" cells in each argument position
4. **Error conditions** — every documented error trigger
5. **Range/array arguments** — if the function accepts ranges, test scalar vs range vs array literal behavior
6. **Key behavioral questions** — pink-highlighted rows for behaviors not clear from spec (expected = "← REPORT", is_question=True)

### Test row format
```python
# Known expected value:
(None, 'description', '=FORMULA(...)', "expected_value", False, "notes"),
# Unknown — needs Excel validation:
(None, 'description', '=FORMULA(...)', None, True, "What does Excel actually return?"),
```

### Instructions section
- How to verify setup area
- Which rows need manual reporting
- What specific questions to answer

## Phase 3: Excel Validation

The user will:
1. Open the generated .xlsx in real Excel (desktop, not online)
2. Verify all PASS/FAIL results in column F
3. Fill in actual values for "← REPORT" rows
4. Report results back (screenshot or text)

When results come back:
1. Update the Python script with all confirmed expected values (set all is_question=False)
2. Output the updated script to chat
3. Document the confirmed answers to all key behavioral questions

## Phase 4: Smoke Tests

Add smoke tests to `test/smoke.spec.ts` following the existing pattern:

```typescript
it('should evaluate {FUNCTION_NAME} with <scenario>', () => {
  const data = [
    [/* setup data */, '={FUNCTION_NAME}(...)'],
  ]
  const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})
  expect(hf.getCellValue(adr('<result_cell>'))).toBe(<expected>)
  hf.destroy()
})
```

Cover 3-5 smoke tests: basic happy path, key edge case, error case.

## Phase 5: Comprehensive Unit Tests

Create `test/{function_name}.spec.ts` with:

```typescript
import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {DetailedCellError} from '../src/CellValue'
import {adr} from './testUtils'

describe('{FUNCTION_NAME}', () => {
  const evaluate = (data: any[][]) => {
    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})
    return {hf, val: (ref: string) => hf.getCellValue(adr(ref))}
  }

  describe('basic functionality', () => { /* ... */ })
  describe('parameter edge cases', () => { /* ... */ })
  describe('type coercion', () => { /* ... */ })
  describe('error propagation', () => { /* ... */ })
  describe('edge cases', () => { /* ... */ })
})
```

**Test patterns:**
- Use `null` in data arrays for truly empty cells
- Use `'=""'` for formula-generated empty strings
- Use `'=1/0'` for #DIV/0!, `'=NA()'` for #N/A
- For error assertions: `expect(result).toBeInstanceOf(DetailedCellError)` then check `.type`
- Always call `hf.destroy()` at end of each test
- Boolean args in formulas must use `TRUE()` / `FALSE()` (function syntax, not bare literals)

**Map every row from the Excel validation workbook to a Jest test.** The Excel workbook IS the test spec.

## Phase 6: Implementation

### 6a. Plugin metadata

In the target plugin file (e.g., `src/interpreter/plugin/TextPlugin.ts`), add to `implementedFunctions`:

```typescript
'{FUNCTION_NAME}': {
  method: '{methodName}',
  // repeatLastArgs: N,        // if last arg(s) repeat (like TEXTJOIN's text args)
  // expandRanges: true,       // if ALL args should be auto-flattened (use false if any arg needs raw range)
  // isVolatile: true,         // if function is volatile (like RAND, NOW)
  // arrayFunction: true,      // if function returns arrays
  parameters: [
    {argumentType: FunctionArgumentType.STRING},    // or NUMBER, BOOLEAN, ANY, RANGE, etc.
    {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0},
    // ... one entry per parameter
  ],
},
```

**FunctionArgumentType options:**
- `STRING` — auto-coerces to string
- `NUMBER` — auto-coerces to number
- `BOOLEAN` — auto-coerces to boolean
- `INTEGER` — number, validated as integer
- `ANY` — no coercion, receives raw value (scalar or range)
- `RANGE` — must be a range reference
- `NOERROR` — propagates errors automatically
- `SCALAR` — any scalar value

**Parameter options:**
- `optionalArg: true` — parameter is optional
- `defaultValue: <value>` — default when omitted
- `minValue: N` / `maxValue: N` — numeric bounds
- `greaterThan: N` / `lessThan: N` — strict numeric bounds

### 6b. Method implementation

```typescript
public {methodName}(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
  return this.runFunction(ast.args, state, this.metadata('{FUNCTION_NAME}'),
    (arg1: <type>, arg2: <type>, ...rest: <type>[]) => {
      // Implementation here
      // Return: string | number | boolean | CellError
    }
  )
}
```

**Key utilities available:**
- `coerceScalarToString(val)` — from `src/interpreter/ArithmeticHelper.ts` (line ~647)
  - EmptyValue → `''`, number → `.toString()`, boolean → `'TRUE'`/`'FALSE'`
- `SimpleRangeValue` — for range args when `expandRanges` is false
  - `.valuesFromTopLeftCorner()` — flattens 2D range to 1D array
  - `.width()` / `.height()` — dimensions
- `CellError(ErrorType.VALUE, ErrorMessage.XXX)` — return errors
- `EmptyValue` symbol — from `src/interpreter/InterpreterValue.ts` (represents truly empty cell)

**Error propagation pattern:**
```typescript
if (val instanceof CellError) return val  // early return propagates the error
```

### 6c. i18n translations

Add the function name translation to ALL 17 language files in `src/i18n/languages/`:

```
csCZ.ts  daDK.ts  deDE.ts  enGB.ts  enUS.ts  esES.ts  fiFI.ts
frFR.ts  huHU.ts  itIT.ts  nbNO.ts  nlNL.ts  plPL.ts  ptPT.ts
ruRU.ts  svSE.ts  trTR.ts
```

Find translations at:
- https://support.microsoft.com/en-us/office/excel-functions-translator
- http://dolf.trieschnigg.nl/excel/index.php

Format: `{FUNCTION_NAME}: '{LocalizedName}',` — inserted alphabetically in each file.

### 6d. Error messages (if needed)

If the function has custom error conditions, add static messages to `src/error-message.ts`:
```typescript
public static {FunctionName}SomeError = '{FUNCTION_NAME} specific error message.'
```

### 6e. Plugin registration

If adding to an **existing** plugin: nothing extra needed — `src/index.ts` auto-registers all plugins from `src/interpreter/plugin/index.ts`.

If creating a **new** plugin:
1. Create `src/interpreter/plugin/{NewPlugin}.ts`
2. Export it from `src/interpreter/plugin/index.ts`
3. It auto-registers via the loop in `src/index.ts` (lines 112-118)

## Phase 7: Verify

1. `npm run lint:fix`
2. `npm run test:unit` — all tests must pass
3. `npm run compile` — no TypeScript errors
4. Review: every Excel validation row has a corresponding Jest test

## Phase 8: Commit & Push

1. Stage modified files
2. Commit with message: "Add {FUNCTION_NAME} built-in function with tests"
3. Push to feature branch

---

## File Checklist

| File | Action |
|------|--------|
| `src/interpreter/plugin/{Plugin}.ts` | Add `implementedFunctions` entry + method |
| `src/i18n/languages/*.ts` (17 files) | Add translation for each language |
| `src/error-message.ts` | Add custom error messages (if needed) |
| `src/interpreter/plugin/index.ts` | Export new plugin (only if new plugin file) |
| `test/{function_name}.spec.ts` | **NEW** — comprehensive unit tests |
| `test/smoke.spec.ts` | Add 3-5 smoke tests |
```

---

## Quick Reference: Existing Plugin → Function Category Mapping

| Plugin File | Function Categories |
|-------------|-------------------|
| `TextPlugin.ts` | CONCATENATE, LEFT, RIGHT, MID, TRIM, LOWER, UPPER, SUBSTITUTE, REPT, TEXTJOIN, TEXT, FIND, SEARCH, REPLACE, LEN, PROPER, CLEAN, T, VALUE |
| `MathPlugin.ts` | SUBTOTAL, SUMPRODUCT, COMBIN, PERMUT, GCD, LCM, MULTINOMIAL, QUOTIENT, FACT, etc. |
| `NumericAggregationPlugin.ts` | SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, PRODUCT, SUMSQ, etc. |
| `StatisticalPlugin.ts` | STDEV, VAR, CORREL, RANK, PERCENTILE, QUARTILE, MODE, etc. |
| `DateTimePlugin.ts` | DATE, TIME, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, NOW, TODAY, etc. |
| `FinancialPlugin.ts` | PMT, FV, PV, NPV, IRR, RATE, etc. |
| `LookupPlugin.ts` | VLOOKUP, HLOOKUP, INDEX, MATCH, CHOOSE, etc. |
| `InformationPlugin.ts` | ISBLANK, ISERROR, ISTEXT, ISNUMBER, ISLOGICAL, TYPE, etc. |
| `BooleanPlugin.ts` | AND, OR, NOT, XOR, IF, IFS, SWITCH |
| `RoundingPlugin.ts` | ROUND, ROUNDUP, ROUNDDOWN, CEILING, FLOOR, TRUNC, INT |
| `ConditionalAggregationPlugin.ts` | SUMIF, SUMIFS, COUNTIF, COUNTIFS, AVERAGEIF, AVERAGEIFS, MINIFS, MAXIFS |
