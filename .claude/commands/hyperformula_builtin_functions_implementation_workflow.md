Implement the built-in Excel function $ARGUMENTS in HyperFormula.

Branch: feature/built-in/$ARGUMENTS
Base: develop

Follow the 8-phase workflow in `built-in_function_implementation_workflow.md`. Each phase in order — do not skip ahead.

## Phase 1: Spec Research

Research $ARGUMENTS thoroughly:

1. Read the official Excel spec and document: syntax, all parameters, return type, error conditions, edge cases
2. Check Google Sheets behavior for any known divergences
3. Search HyperFormula codebase for any existing partial implementation:
   - `src/interpreter/plugin/` — check `implementedFunctions`
   - `src/i18n/languages/enGB.ts` — check if translation key exists
   - `test/` — check for any existing tests
4. Identify the target plugin file (see Quick Reference at bottom of workflow doc)

Produce a **spec summary**: syntax, parameters (name/type/required/default/range), return type, error conditions, key behavioral questions (mark TBD).

## Phase 2: Excel Validation Workbook

Generate a Python/openpyxl script creating a validation workbook. Output to chat only — do NOT add to repo.

Include: Setup Area (fixture values), Test Matrix (columns: #, Description, Formula text, Expected, Actual live formula, Pass/Fail, Notes), groups: core sanity, parameter edge cases, type coercion, error conditions, range/array args, key behavioral questions (pink rows, expected = "← REPORT").

## Phase 3: Excel Validation

Wait for user to run the workbook in real Excel (desktop) and report results. Then update the script with confirmed values and document answers to all behavioral questions.

## Phase 4: Smoke Tests

Add 3-5 tests to `test/smoke.spec.ts`: basic happy path, key edge case, error case.

## Phase 5: Comprehensive Unit Tests

Create `test/{function_name}.spec.ts`. Map **every** Excel validation workbook row to a Jest test.

Patterns:
- `null` = truly empty cell; `'=""'` = formula empty string; `'=1/0'` = #DIV/0!; `'=NA()'` = #N/A
- Error assertions: `expect(result).toBeInstanceOf(DetailedCellError)` + check `.type`
- Always `hf.destroy()` at end of each test
- Booleans in formulas: `TRUE()` / `FALSE()` (not bare literals)

## Phase 6: Implementation

### 6a. Plugin metadata — add to `implementedFunctions` in target plugin:
```typescript
'$ARGUMENTS': {
  method: '{methodName}',
  // repeatLastArgs: N        // variadic trailing args
  // expandRanges: true       // only if ALL args can be flattened
  parameters: [
    {argumentType: FunctionArgumentType.STRING},
    {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0},
  ],
},
```

### 6b. Method:
```typescript
public {methodName}(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
  return this.runFunction(ast.args, state, this.metadata('$ARGUMENTS'),
    (arg1: <type>, ...rest: <type>[]) => { /* return string | number | boolean | CellError */ }
  )
}
```

### 6c. i18n — add translation to ALL 17 language files in `src/i18n/languages/` (alphabetical order):
`csCZ daDK deDE enGB enUS esES fiFI frFR huHU itIT nbNO nlNL plPL ptPT ruRU svSE trTR`

Sources: https://support.microsoft.com/en-us/office/excel-functions-translator | http://dolf.trieschnigg.nl/excel/index.php

### 6d. Error messages (if needed) — add to `src/error-message.ts`

### 6e. Registration — existing plugin: nothing needed. New plugin: export from `src/interpreter/plugin/index.ts`.

## Phase 7: Verify

```bash
npm run lint:fix
npm run test:unit
npm run compile
```

All must pass. Every Excel validation row must have a corresponding Jest test.

## Phase 8: Commit & Push

```bash
git add <files>
git commit -m "Add $ARGUMENTS built-in function with tests"
git push -u origin feature/built-in/$ARGUMENTS
```

---

## File Checklist

| File | Action |
|------|--------|
| `src/interpreter/plugin/{Plugin}.ts` | Add `implementedFunctions` entry + method |
| `src/i18n/languages/*.ts` (17 files) | Add translation |
| `src/error-message.ts` | Add custom error messages (if needed) |
| `src/interpreter/plugin/index.ts` | Export new plugin (only if new plugin) |
| `test/{function_name}.spec.ts` | NEW — comprehensive unit tests |
| `test/smoke.spec.ts` | Add 3-5 smoke tests |
