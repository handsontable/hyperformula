# Iterative calculation

Use iterative calculation to resolve circular references in your spreadsheet formulas.

## What is iterative calculation?

A **circular reference** occurs when a formula refers back to its own cell. For example:

- `A1` contains `=A1+1`
- `A1` contains `=B1+1` and `B1` contains `=A1+1`

By default, HyperFormula returns a [`#CYCLE!`](types-of-errors.md) error for circular references. However, some spreadsheet models intentionally use circular references for iterative calculations, such as:

- **Financial modeling**: calculating loan payments where interest depends on the balance
- **Goal seeking**: finding values that satisfy a target condition
- **Numerical methods**: implementing Newton-Raphson or other iterative algorithms
- **Feedback systems**: modeling systems where outputs influence inputs

When iterative calculation is enabled, HyperFormula repeatedly evaluates the circular formulas until the values stabilize (converge) or a maximum number of iterations is reached.

## How it works

1. All cells in the cycle are initialized to a starting value (default: `0`)
2. Cells are evaluated in address order (by sheet, then row, then column)
3. Each cell immediately uses the most recently computed values from other cells
4. After each complete pass, HyperFormula checks if all values have converged
5. Iteration stops when values converge or the maximum iterations are reached

### Convergence

A cell is considered **converged** when:

- **(numeric values)** the change between iterations is below the configured threshold: `|new - old| < threshold` OR
- **(strings, booleans)**: the value stop changing between iterations

All cells in the cycle must converge for iteration to stop early.

## Enabling iterative calculation

To enable iterative calculation, set the [`iterativeCalculationEnable`](../api/interfaces/configparams.html#iterativecalculationenable) option to `true`:

```javascript
const hfInstance = HyperFormula.buildFromArray(
  [
    ['=A1+1'],  // A1 references itself
  ],
  {
    licenseKey: 'gpl-v3',
    iterativeCalculationEnable: true,
  }
);

// With default settings (100 iterations, threshold 0.001, initial value 0):
// A1 will equal 100 after iteration completes
console.log(hfInstance.getCellValue({ sheet: 0, row: 0, col: 0 })); // 100
```

::: tip
Iterative calculation settings are configured at engine initialization and apply to all sheets.
:::

## Configuration options

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| [`iterativeCalculationEnable`](../api/interfaces/configparams.html#iterativecalculationenable) | `boolean` | `false` | Enable iterative calculation for circular references |
| [`iterativeCalculationMaxIterations`](../api/interfaces/configparams.html#iterativecalculationmaxiterations) | `number` | `100` | Maximum number of iterations before stopping |
| [`iterativeCalculationConvergenceThreshold`](../api/interfaces/configparams.html#iterativecalculationconvergencethreshold) | `number` | `0.001` | Values must change by less than this to be considered converged |
| [`iterativeCalculationInitialValue`](../api/interfaces/configparams.html#iterativecalculationinitialvalue) | `number \| string \| boolean \| Date` | `0` | Starting value for cells in circular references |

## Example

Two cells that converge to a stable value:

```javascript
const hf = HyperFormula.buildFromArray(
  [
    ['=B1/2 + 1', '=A1/2 + 1'],  // A1 and B1 reference each other
  ],
  {
    licenseKey: 'gpl-v3',
    iterativeCalculationEnable: true,
    iterativeCalculationConvergenceThreshold: 0.0001,
  }
);

// Both cells converge to 2
console.log(hf.getCellValue({ sheet: 0, row: 0, col: 0 })); // ~2 (A1)
console.log(hf.getCellValue({ sheet: 0, row: 0, col: 1 })); // ~2 (B1)
```

## Behavior notes

### Non-converging formulas

Some formulas never converge (e.g., `=A1+1` always increases). In these cases, iteration runs until `iterativeCalculationMaxIterations` is reached, and the final value is used.

### Error handling

If a formula in the cycle produces an error during iteration (e.g., `#DIV/0!`), the error becomes the cell's final value. Cells depending on error values will propagate the error.

### Ranges containing cycles

If a range reference (e.g., `SUM(A1:A10)`) includes cells that are part of a cycle, the range is recalculated on each iteration to reflect the updated values.

### Recalculation behavior

When any cell in a circular reference is modified, the entire cycle is re-evaluated from the initial value. Previous converged values are not preserved between recalculations.
