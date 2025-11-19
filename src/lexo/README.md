# Lexo-HyperFormula Integration

This module provides utilities to evaluate formulas from lexo-workbook using HyperFormula's powerful calculation engine.

## Overview

The lexo integration layer handles:
- Converting lexo's pod/bag/scenario structure to HyperFormula's sheet-based model
- Translating lexo-style formula references to HyperFormula format
- Caching HyperFormula instances per scenario for performance
- Evaluating formulas with full access to HyperFormula's 400+ functions

## Quick Start

```typescript
import { evaluate } from 'hyperformula/lexo';

// Evaluate a formula in context
const result = evaluate(workbook, scenarioId, podId, '=SUM(A1:A10)');

// Result can be: number | string | boolean | LexoCellError | null
if (typeof result === 'object' && result !== null && 'code' in result) {
  console.error('Formula error:', result.message);
} else {
  console.log('Result:', result);
}
```

## Formula Reference Translation

The module automatically translates lexo-style references to HyperFormula format:

### Local References
```typescript
// Lexo: A1, B2, etc.
eval(workbook, scenarioId, podId, '=A1+B2')
// Evaluates cells in the current pod
```

### Same-Bag Pod References
```typescript
// Lexo: PodName!A1
eval(workbook, scenarioId, podId, '=Revenue!B2')
// Translates to: BagName__Revenue!B2
```

### Cross-Bag References
```typescript
// Lexo: BagName!PodName!A1
eval(workbook, scenarioId, podId, '=Marketing!Revenue!B2')
// Translates to: Marketing__Revenue!B2
```

### With Quoted Names (spaces allowed)
```typescript
// Lexo: 'Bag Name'!'Pod Name'!A1
eval(workbook, scenarioId, podId, "='Sales Data'!'Q1 Revenue'!A1")
// Translates to: Sales Data__Q1 Revenue!A1
```

### Range References
All reference types support ranges:
```typescript
eval(workbook, scenarioId, podId, '=SUM(A1:A10)')
eval(workbook, scenarioId, podId, '=SUM(Revenue!A1:A10)')
eval(workbook, scenarioId, podId, "=SUM('Other Bag'!Revenue!A1:A10)")
```

## Supported Functions

HyperFormula provides 400+ Excel-compatible functions including:

### Math & Statistics
- `SUM`, `AVERAGE`, `COUNT`, `MIN`, `MAX`, `MEDIAN`, `STDEV`, `VAR`
- `SUMIF`, `SUMIFS`, `COUNTIF`, `COUNTIFS`, `AVERAGEIF`, `AVERAGEIFS`
- `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `FLOOR`, `CEILING`
- `ABS`, `POWER`, `SQRT`, `EXP`, `LN`, `LOG`, `LOG10`
- `SIN`, `COS`, `TAN`, `ASIN`, `ACOS`, `ATAN`, `ATAN2`
- `RAND`, `RANDBETWEEN`

### Logical
- `IF`, `IFS`, `AND`, `OR`, `NOT`, `XOR`
- `IFERROR`, `IFNA`, `SWITCH`

### Text
- `CONCATENATE`, `CONCAT`, `TEXTJOIN`
- `LEFT`, `RIGHT`, `MID`, `LEN`, `TRIM`
- `UPPER`, `LOWER`, `PROPER`
- `FIND`, `SEARCH`, `SUBSTITUTE`, `REPLACE`

### Lookup & Reference
- `VLOOKUP`, `HLOOKUP`, `XLOOKUP`
- `INDEX`, `MATCH`
- `CHOOSE`, `OFFSET`

### Date & Time
- `DATE`, `TIME`, `NOW`, `TODAY`
- `YEAR`, `MONTH`, `DAY`, `HOUR`, `MINUTE`, `SECOND`
- `DATEVALUE`, `TIMEVALUE`
- `EDATE`, `EOMONTH`, `WEEKDAY`, `WORKDAY`

### Financial
- `PMT`, `IPMT`, `PPMT`, `FV`, `PV`, `RATE`, `NPER`
- `NPV`, `IRR`, `XIRR`, `MIRR`

### Array Functions
- `TRANSPOSE`, `MMULT`, `SUMPRODUCT`
- `FILTER`, `SORT`, `UNIQUE`

And many more! See [HyperFormula documentation](https://hyperformula.handsontable.com/guide/built-in-functions.html) for the complete list.

## API Reference

### `evaluate(workbook, scenarioId, podId, formula)`

Evaluates a formula in the context of a specific workbook, scenario, and pod.

**Parameters:**
- `workbook: LexoWorkBook` - The lexo workbook
- `scenarioId: ScenarioId` - The scenario to evaluate in
- `podId: PodId` - The pod context for formula evaluation
- `formula: string` - The formula to evaluate (with or without leading `=`)

**Returns:** `LexoEvalResult`
- `number` - Numeric result
- `string` - Text result
- `boolean` - Boolean result
- `null` - Empty cell result
- `LexoCellError` - Error object with `code` and `message`

**Example:**
```typescript
const result = evaluate(workbook, 'scenario1', 'pod1', '=SUM(A1:A10) * 1.1');
```

### `clearCache(workbook?, scenarioId?)`

Clears cached HyperFormula instances.

**Parameters:**
- `workbook?: LexoWorkBook` - Optional: specific workbook to clear
- `scenarioId?: ScenarioId` - Optional: specific scenario to clear

**Example:**
```typescript
// Clear all cached instances
clearCache();

// Clear specific scenario
clearCache(workbook, 'scenario1');
```

### `parseToAst(workbook, podId, formula)`

Parses a formula to its Abstract Syntax Tree (AST) for debugging or analysis.

**Parameters:**
- `workbook: LexoWorkBook` - The lexo workbook
- `podId: PodId` - The pod context
- `formula: string` - The formula to parse

**Returns:** AST object

**Example:**
```typescript
const ast = parseToAst(workbook, 'pod1', '=SUM(A1:A10)');
console.log(ast);
```

## Advanced Usage

### Converting Workbook Structure

```typescript
import { convertWorkbookToSheets, convertPodToSheet } from 'hyperformula/lexo';

// Convert entire workbook for a scenario
const sheets = convertWorkbookToSheets(workbook, scenarioId);

// Convert single pod
const sheet = convertPodToSheet(workbook, podId, scenarioId);
```

### Manual Formula Translation

```typescript
import { translateLexoFormula } from 'hyperformula/lexo';

const translated = translateLexoFormula(
  workbook,
  currentPodId,
  '=Revenue!A1 + Marketing!Budget!B2'
);
// Returns: "=CurrentBag__Revenue!A1 + Marketing__Budget!B2"
```

### Cell Address Utilities

```typescript
import { parseCellAddress, indicesToCellAddress } from 'hyperformula/lexo';

// Parse A1 notation
const { row, col } = parseCellAddress('B5'); // { row: 4, col: 1 }

// Convert indices to A1
const address = indicesToCellAddress(1, 4); // "B5"
```

## Performance Considerations

1. **Caching**: HyperFormula instances are cached per scenario. The cache is automatically managed but can be cleared manually when needed.

2. **Lazy Loading**: HyperFormula instances are created on-demand when first formula is evaluated for a scenario.

3. **Batch Operations**: If evaluating multiple formulas for the same scenario, they reuse the same cached instance.

4. **Memory Management**: Call `clearCache()` when scenarios are deleted or modified to free memory.

## Error Handling

The module maps HyperFormula errors to lexo error codes:

| HyperFormula Error | Lexo Error Code |
|-------------------|-----------------|
| `#VALUE!`         | `SYNTAX`        |
| `#REF!`           | `REF`           |
| `#DIV/0!`         | `DIV0`          |
| `#NUM!`           | `SYNTAX`        |
| `#N/A`            | `REF`           |
| `#NAME?`          | `REF`           |
| Circular reference | `CYCLE`        |

## Integration Example

```typescript
// In lexo-workbook/src/formula/eval.ts
import { eval as evaluateLexoFormula } from 'hyperformula/lexo';
import { WorkBook, ScenarioId, PodId, CellValueType, CellError } from '../models/workbook';

export function evaluateFormula(
  workBook: WorkBook,
  podId: PodId,
  scenarioId: ScenarioId,
  formula: string
): CellValueType | CellError {
  // Cast workBook to LexoWorkBook (they have the same structure)
  const result = evaluateLexoFormula(workBook as any, scenarioId, podId, formula);
  
  // Result is already in the correct format
  return result;
}
```

## Type Definitions

The module exports TypeScript types that mirror lexo-workbook structures:

```typescript
import type {
  LexoWorkBook,
  LexoScenario,
  LexoPod,
  LexoBag,
  LexoCell,
  LexoCellError,
  LexoEvalResult,
} from 'hyperformula/lexo';
```

## License

This module is part of HyperFormula and follows the same license (GPLv3 or commercial).

