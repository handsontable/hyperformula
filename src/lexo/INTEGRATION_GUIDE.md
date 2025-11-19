# Lexo-Workbook Integration Guide

This guide shows how to integrate the lexo-HyperFormula utilities into your lexo-workbook project.

## Installation

Since you're maintaining a custom branch of HyperFormula:

```bash
cd hyperformula
git checkout -b lexo-main
# The lexo utilities are already in src/lexo/
npm run build:lexo
```

In your lexo-workbook, reference the local HyperFormula:

```bash
cd lexo-workbook
npm link ../hyperformula
# or use package.json with file path
```

## Basic Integration

### Step 1: Update eval.ts

Replace your existing `evaluateFormula` function in `lexo-workbook/src/formula/eval.ts`:

```typescript
import { lexo } from 'hyperformula';
import {
    WorkBook, CellError,
    ScenarioId, PodId,
    CellValueType
} from '../models/workbook';

/**
 * Evaluates a formula against the current workbook state in a specific scenario
 */
export function evaluateFormula(
    workBook: WorkBook,
    podId: PodId,
    scenarioId: ScenarioId,
    formula: string
): CellValueType | CellError {
    try {
        // Cast WorkBook to LexoWorkBook (they have compatible structures)
        const result = lexo.evaluate(
            workBook as any,
            scenarioId,
            podId,
            formula
        );
        
        // Result is already in the correct format
        return result as CellValueType | CellError;
    } catch (error) {
        return {
            code: 'SYNTAX',
            message: error instanceof Error ? error.message : 'Invalid formula'
        };
    }
}

/**
 * Clear cached HyperFormula instances
 * Call this when scenarios are modified or deleted
 */
export function clearFormulaCache(
    workBook?: WorkBook,
    scenarioId?: ScenarioId
): void {
    lexo.clearCache(workBook as any, scenarioId);
}
```

### Step 2: That's It!

Your existing code that calls `evaluateFormula` will now use HyperFormula's engine with 400+ functions!

## Migration Benefits

### Before (your custom evaluator):
- ❌ Limited to ~7 functions (SUM, AVERAGE, COUNT, MIN, MAX, IF, SUMPRODUCT)
- ❌ Manual dependency tracking
- ❌ Custom parser with limited syntax support
- ❌ No array formulas
- ❌ Limited error handling

### After (with HyperFormula):
- ✅ 400+ Excel-compatible functions
- ✅ Automatic dependency tracking and recalculation
- ✅ Full Excel formula syntax
- ✅ Array formulas and spill ranges
- ✅ Robust error handling
- ✅ Performance optimizations
- ✅ Named expressions support
- ✅ Date/time functions
- ✅ Financial functions (NPV, IRR, PMT, etc.)
- ✅ Lookup functions (VLOOKUP, XLOOKUP, etc.)

## Formula Compatibility

Your existing lexo-style formulas work automatically:

```typescript
// Local references - WORKS
evaluateFormula(workBook, podId, scenarioId, '=A1+B2')
evaluateFormula(workBook, podId, scenarioId, '=SUM(A1:A10)')

// Same-bag references - WORKS
evaluateFormula(workBook, podId, scenarioId, '=Revenue!A1')
evaluateFormula(workBook, podId, scenarioId, '=SUM(Revenue!A1:A10)')

// Cross-bag references - WORKS
evaluateFormula(workBook, podId, scenarioId, '=Marketing!Revenue!B2')
evaluateFormula(workBook, podId, scenarioId, "='Sales Data'!'Q1 Revenue'!A1")
```

## New Functions Available

Now you can use hundreds of new functions:

```typescript
// Financial
evaluateFormula(workBook, podId, scenarioId, '=NPV(0.1, A1:A10)')
evaluateFormula(workBook, podId, scenarioId, '=PMT(5%/12, 360, 800000)')
evaluateFormula(workBook, podId, scenarioId, '=IRR(A1:A10)')

// Lookup
evaluateFormula(workBook, podId, scenarioId, '=VLOOKUP(A1, Revenue!A:B, 2, FALSE)')
evaluateFormula(workBook, podId, scenarioId, '=XLOOKUP(A1, Revenue!A:A, Revenue!B:B)')

// Date/Time
evaluateFormula(workBook, podId, scenarioId, '=EOMONTH(A1, 0)')
evaluateFormula(workBook, podId, scenarioId, '=NETWORKDAYS(A1, B1)')

// Text
evaluateFormula(workBook, podId, scenarioId, '=TEXTJOIN(", ", TRUE, A1:A10)')
evaluateFormula(workBook, podId, scenarioId, '=CONCATENATE(A1, " - ", B1)')

// Advanced Math
evaluateFormula(workBook, podId, scenarioId, '=SUMIFS(Revenue!B:B, Revenue!A:A, ">100")')
evaluateFormula(workBook, podId, scenarioId, '=COUNTIFS(A:A, ">0", B:B, "<100")')

// Array Functions
evaluateFormula(workBook, podId, scenarioId, '=TRANSPOSE(A1:B10)')
evaluateFormula(workBook, podId, scenarioId, '=FILTER(A1:B10, A1:A10>100)')
```

## Performance Considerations

### Caching
HyperFormula instances are cached per scenario. When you:
- Evaluate a formula for a scenario → Instance created/reused
- Modify scenario data → Call `clearFormulaCache(workBook, scenarioId)`
- Delete a scenario → Call `clearFormulaCache(workBook, scenarioId)`
- Restart app → Call `clearFormulaCache()` to free memory

### Best Practices

```typescript
// ✅ GOOD: Reuse scenario for multiple evaluations
const results = [
  evaluateFormula(workBook, pod1, scenario1, '=SUM(A1:A10)'),
  evaluateFormula(workBook, pod1, scenario1, '=AVERAGE(B1:B10)'),
  evaluateFormula(workBook, pod2, scenario1, '=Revenue!A1 * 1.1'),
];

// ❌ BAD: Don't forget to clear cache when data changes
updateScenarioData(workBook, scenario1, newData);
// Missing: clearFormulaCache(workBook, scenario1);
const result = evaluateFormula(workBook, podId, scenario1, formula); // Uses stale data!

// ✅ GOOD: Clear cache after updates
updateScenarioData(workBook, scenario1, newData);
clearFormulaCache(workBook, scenario1);
const result = evaluateFormula(workBook, podId, scenario1, formula); // Fresh data
```

## Debugging

### Parse formula to AST

```typescript
import { lexo } from 'hyperformula';

try {
  const ast = lexo.parseToAst(workBook as any, podId, '=SUM(A1:A10)');
  console.log('AST:', JSON.stringify(ast, null, 2));
} catch (error) {
  console.error('Parse error:', error);
}
```

### Check formula translation

```typescript
import { lexo } from 'hyperformula';

const original = '=Revenue!A1 + Marketing!Budget!B2';
const translated = lexo.translateLexoFormula(
  workBook as any,
  podId,
  original
);
console.log('Original:', original);
console.log('Translated:', translated);
// Output: "=MainBag__Revenue!A1 + Marketing__Budget!B2"
```

### Inspect cell values

```typescript
import { lexo } from 'hyperformula';

const cellValue = lexo.getCellValueForScenario(
  workBook as any,
  scenarioId,
  cellId
);
console.log('Cell value:', cellValue);
```

## Backward Compatibility

All your existing formulas will continue to work. The lexo utilities:
1. Accept the same formula syntax
2. Return the same result types
3. Use the same error codes
4. Support the same reference patterns

You can gradually adopt new functions without breaking existing code.

## Testing

Update your tests to use the new evaluator:

```typescript
import { evaluateFormula, clearFormulaCache } from '../src/formula/eval';

describe('Formula Evaluation', () => {
  afterEach(() => {
    clearFormulaCache(); // Clean up after each test
  });

  it('should evaluate SUM', () => {
    const result = evaluateFormula(workBook, podId, scenarioId, '=SUM(A1:A10)');
    expect(result).toBe(expectedSum);
  });

  it('should support new financial functions', () => {
    const result = evaluateFormula(workBook, podId, scenarioId, '=NPV(0.1, A1:A5)');
    expect(typeof result).toBe('number');
  });

  it('should handle cross-pod references', () => {
    const result = evaluateFormula(workBook, podId, scenarioId, '=Revenue!A1 * 2');
    expect(result).toBe(expectedResult);
  });
});
```

## Troubleshooting

### Error: "Pod not found in scenario"
- Ensure the pod exists in the workbook
- Verify the scenario has data for that pod
- Check pod IDs match exactly

### Error: Formula returns wrong value
- Clear the cache: `clearFormulaCache(workBook, scenarioId)`
- Verify scenario data is up-to-date
- Check cell values with `getCellValueForScenario`

### Error: "Invalid formula"
- Check formula syntax
- Use `parseToAst` to debug
- Verify cell references exist
- Check for typos in pod/bag names

### Performance Issues
- Clear cache periodically: `clearFormulaCache()`
- Avoid evaluating formulas in tight loops
- Batch formula evaluations when possible

## Next Steps

1. Replace your `eval.ts` with the new implementation
2. Test with existing formulas
3. Gradually adopt new functions
4. Update documentation for your users
5. Add tests for new functionality

## Support

For HyperFormula-specific questions:
- [HyperFormula Documentation](https://hyperformula.handsontable.com/)
- [Function Reference](https://hyperformula.handsontable.com/guide/built-in-functions.html)
- [API Reference](https://hyperformula.handsontable.com/api/)

For lexo integration questions:
- See `src/lexo/README.md` in the HyperFormula repo
- Check `src/lexo/example.ts` for usage examples

