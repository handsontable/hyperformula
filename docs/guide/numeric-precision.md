# Numeric precision

HyperFormula provides a configurable numeric system that allows you to choose between high-precision decimal arithmetic and standard JavaScript numbers. This is especially important for financial calculations where floating-point precision issues can lead to incorrect results.

## The problem with JavaScript numbers

JavaScript uses IEEE-754 double-precision floating-point numbers, which can lead to unexpected precision issues:

```javascript
// Standard JavaScript floating-point issues
0.1 + 0.2           // 0.30000000000000004 (not 0.3!)
0.3 - 0.1 - 0.2     // -2.7755575615628914e-17 (not 0!)
1.1 + 2.2           // 3.3000000000000003 (not 3.3!)
0.1 * 3             // 0.30000000000000004 (not 0.3!)
```

These issues can accumulate in financial calculations and lead to incorrect totals, rounding errors, and missing cents.

## Numeric implementations

HyperFormula offers two numeric implementations:

| Implementation | Description | Use case |
|:---------------|:------------|:---------|
| `'precise'` | High-precision decimal arithmetic using [decimal.js](https://mikemcl.github.io/decimal.js/) | Financial calculations, exact decimal arithmetic |
| `'native'` | Standard JavaScript IEEE-754 float64 numbers | Maximum performance, backward compatibility |

### Precise mode (default)

The `'precise'` mode uses arbitrary-precision decimal arithmetic, which guarantees exact results for decimal operations:

```javascript
const hf = HyperFormula.buildFromArray([
  ['0.1', '0.2', '=A1+B1'],  // Result: exactly 0.3
  ['0.3', '0.1', '=A2-B2-0.2'],  // Result: exactly 0
], {
  licenseKey: 'gpl-v3',
  numericImplementation: 'precise',  // default
});

// Get precise string representation
console.log(hf.getCellValueWithPrecision({ sheet: 0, row: 0, col: 2 }));  // "0.3"
```

### Native mode

The `'native'` mode uses standard JavaScript numbers for maximum performance:

```javascript
const hf = HyperFormula.buildFromArray([
  ['0.1', '0.2', '=A1+B1'],
], {
  licenseKey: 'gpl-v3',
  numericImplementation: 'native',
});

// Standard JavaScript behavior
console.log(hf.getCellValue({ sheet: 0, row: 0, col: 2 }));  // 0.30000000000000004
```

## Configuration options

### numericImplementation

Selects the numeric implementation to use.

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `numericImplementation` | `'precise'` \| `'native'` | `'precise'` | The numeric implementation to use |

### numericDigits

Sets the number of significant digits for calculations (only applies to `'precise'` mode).

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `numericDigits` | `number` | `34` | Number of significant digits (1 to 1e+9) |

### numericRounding

Sets the default rounding mode (only applies to `'precise'` mode).

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `numericRounding` | `RoundingMode` | `ROUND_HALF_UP` | Default rounding mode |

#### Available rounding modes

| Mode | Value | Description |
|:-----|:------|:------------|
| `ROUND_UP` | 0 | Round away from zero |
| `ROUND_DOWN` | 1 | Round towards zero (truncate) |
| `ROUND_CEIL` | 2 | Round towards positive infinity |
| `ROUND_FLOOR` | 3 | Round towards negative infinity |
| `ROUND_HALF_UP` | 4 | Round to nearest, ties away from zero (standard rounding) |
| `ROUND_HALF_DOWN` | 5 | Round to nearest, ties towards zero |
| `ROUND_HALF_EVEN` | 6 | Round to nearest, ties to even (banker's rounding) |
| `ROUND_HALF_CEIL` | 7 | Round to nearest, ties towards positive infinity |
| `ROUND_HALF_FLOOR` | 8 | Round to nearest, ties towards negative infinity |

## Example: Financial calculation

```javascript
import HyperFormula, { RoundingMode } from 'hyperformula';

// Create a financial calculation engine with banker's rounding
const hf = HyperFormula.buildFromArray([
  ['Item', 'Quantity', 'Unit Price', 'Total'],
  ['Widget A', '100', '19.99', '=B2*C2'],
  ['Widget B', '250', '7.49', '=B3*C3'],
  ['Widget C', '50', '149.99', '=B4*C4'],
  ['', '', 'Subtotal', '=SUM(D2:D4)'],
  ['', '', 'Tax (8.25%)', '=D5*0.0825'],
  ['', '', 'Grand Total', '=D5+D6'],
], {
  licenseKey: 'gpl-v3',
  numericImplementation: 'precise',
  numericDigits: 34,
  numericRounding: RoundingMode.ROUND_HALF_EVEN,  // Banker's rounding
});

// Get results with full precision
const subtotal = hf.getCellValueWithPrecision({ sheet: 0, row: 4, col: 3 });
const tax = hf.getCellValueWithPrecision({ sheet: 0, row: 5, col: 3 });
const total = hf.getCellValueWithPrecision({ sheet: 0, row: 6, col: 3 });

console.log(`Subtotal: $${subtotal}`);
console.log(`Tax: $${tax}`);
console.log(`Total: $${total}`);
```

## Best practices for financial calculations

### 1. Use string inputs for decimal values

To preserve precision from the start, pass decimal values as strings:

```javascript
// Good: String input preserves precision
const hf = HyperFormula.buildFromArray([
  ['19.99'],  // String - exact
  [19.99],    // Number - may lose precision
]);
```

### 2. Use getCellValueWithPrecision for output

To get the exact calculated value as a string:

```javascript
// Get numeric value (may lose precision when converting to JS number)
const numericValue = hf.getCellValue({ sheet: 0, row: 0, col: 0 });

// Get string value with full precision
const preciseValue = hf.getCellValueWithPrecision({ sheet: 0, row: 0, col: 0 });
```

### 3. Choose appropriate rounding mode

- **ROUND_HALF_UP (4)**: Standard rounding, good for most cases
- **ROUND_HALF_EVEN (6)**: Banker's rounding, reduces cumulative bias
- **ROUND_DOWN (1)**: Truncation, useful for conservative calculations

### 4. Consider performance trade-offs

The `'precise'` mode is slower than `'native'` mode. For large datasets where precision is not critical, consider using `'native'` mode:

| Mode | Relative Speed | Use Case |
|:-----|:---------------|:---------|
| `'native'` | ~1x (baseline) | General calculations, large datasets |
| `'precise'` | ~3-5x slower | Financial calculations, exact arithmetic |

## API Reference

### Numeric types

HyperFormula exports the following types for working with the numeric system:

```typescript
import {
  // Types and interfaces
  Numeric,              // Interface for numeric values
  NumericFactory,       // Interface for creating Numeric instances
  NumericConfig,        // Configuration options
  NumericImplementation,// Type: 'precise' | 'native'
  RoundingMode,         // Enum for rounding modes
  
  // Classes
  NumericProvider,      // Provider for managing numeric factories
  DecimalNumericFactory,// Factory for decimal.js implementation
  NativeNumericFactory, // Factory for native JS numbers
  
  // Utilities
  isNumeric,            // Type guard function
} from 'hyperformula';
```

### Custom numeric implementations

You can create custom numeric implementations by implementing the `NumericFactory` interface:

```typescript
import { NumericFactory, Numeric, NumericConfig } from 'hyperformula';

class MyCustomFactory implements NumericFactory {
  create(value: number | string | Numeric): Numeric {
    // Your implementation
  }
  
  zero(): Numeric { /* ... */ }
  one(): Numeric { /* ... */ }
  // ... other methods
}
```

## Related documentation

- [Configuration options](configuration-options.md)
- [Performance](performance.md)
- [Types of values](types-of-values.md)
- [Specifications and limits](specifications-and-limits.md)
