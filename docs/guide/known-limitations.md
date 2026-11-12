---
title: "Known limitations"
tags:
  - unsupported features
  - multiple workbooks
  - 3D references
  - dynamic arrays
  - asynchronous functions
  - structured references
---

This page lists the known limitations of HyperFormula at its current development stage:

* Node.js versions older than 13 don't properly compare
culture-insensitive strings. HyperFormula requires the full
International Components for Unicode (ICU) to be supported.
[Learn more](https://nodejs.org/api/intl.html#intl_embed_the_entire_icu_full_icu)
* Multiple workbooks are not supported. One instance of HyperFormula
can handle only one workbook with multiple worksheets at a time.
* For cycle detection, all possible dependencies between cells are
taken into account, even if some of them could be omitted after
the full evaluation of expressions and condition statements. The
most prominent example of this behavior is the "IF" function which
returns a cycle error regardless of whether TRUE or FALSE causes
a circular reference.
* Named ranges behave differently depending on where they are used in a formula. For details, see [Using named ranges in formulas](named-expressions.md#using-named-ranges-in-formulas).
* [Custom functions](custom-functions.md) don't automatically recalculate the size of their [result arrays](custom-functions.md#return-an-array-of-data) when the formula dependencies change.
* An array formula over a whole column or row (e.g., `=SORT(A:A)`) keeps the size it had when it was first calculated. If its result grows past that size, for example because the source grows or more values match a `FILTER` condition, the formula returns the `#SPILL!` error until the result fits again. Clearing cells that made the source taller is not enough, because the sheet keeps its size; removing those rows or columns is.
* There is no relative referencing in named ranges.
* The library doesn't offer (at least not yet) the following features:
  * 3D references
  * Constant arrays
  * Dynamic arrays
  * Asynchronous functions
  * Structured references ("Tables")
  * Relative named expressions
  * Functions cannot use UI metadata (e.g., hidden rows for SUBTOTAL).

## Nuances of the implemented functions

* HyperFormula immediately instantiates references to single cells to their values, instead of treating them as 1-length ranges, which slightly changes the behavior of some functions (e.g., NPV).
* SUBTOTAL function does not ignore nested subtotals.
* CHISQ.INV, CHISQ.INV.RT, CHISQ.DIST.RT, CHIDIST, CHIINV and CHISQ.DIST (CHISQ.DIST in CDF mode): Running time grows linearly with the value of the second parameter, degrees_of_freedom (slow for values>1e7).
* GAMMA.DIST, GAMMA.INV, GAMMADIST, GAMMAINV (GAMMA.DIST and GAMMADIST in CDF mode): Running time grows linearly with the value of the second parameter, alpha (slow for values>1e7). 
* For certain inputs, the RATE function might have no solutions, or have multiple solutions. Our implementation uses an iterative algorithm (Newton's method) to find an approximation for one of the solutions to within 1e-7. If the approximation is not found after 50 iterations, the RATE function returns the `#NUM!` error.
* The INDEX function doesn't support returning whole rows or columns of the source range – it always returns the contents of a single cell.
* The FILTER function accepts either single rows of equal width or single columns of equal height. In other words, all arrays passed to the FILTER function must have equal dimensions, and at least one of those dimensions must be 1.
* Array-producing functions (e.g., SEQUENCE, FILTER) require their output dimensions to be determinable at parse time. Passing cell references or formulas as dimension arguments (e.g., `=SEQUENCE(A1)`) results in a `#VALUE!` error, because the output size cannot be resolved before evaluation.
* `FILTER` and `UNIQUE` reserve the size of their source before they are evaluated, because the size of their result is not known until then. Near the sheet edge set by [`maxRows`](../api/interfaces/configparams.md#maxrows) and [`maxColumns`](../api/interfaces/configparams.md#maxcolumns), they return `#SPILL!` when that reserved area does not fit, even if the result itself would. For example, with `maxRows` set to `4` and 1 to 4 in `A1:A4`, `=FILTER(A1:A4, A1:A4>2)` in `B3` returns `#SPILL!`.
* The TEXT function does not accept embedded double-quote literals in the format string. In Excel, `""` inside a format string is an escape sequence for a literal `"` character — e.g. `=TEXT(1234.5, "#,##0.00 ""zł""")` returns `"1,234.50 zł"`. If your application requires this escape sequence, supply a custom [`stringifyCurrency`](currency-handling.md) callback.

### UNIQUE function

* Comparison of values follows HyperFormula's own equality rules, which honor the `caseSensitive` and `accentSensitive` configuration options. By default comparison is case-insensitive.

* When `ExactlyOnce` is TRUE and no row or column occurs exactly once, `UNIQUE` returns a `#N/A` error (the result would otherwise be empty).
### SORT function

* The `SortIndex` argument accepts a single key only. Multi-key sorting through an array constant (for example `=SORT(A1:B9, {1,2})`) is not supported; sort by one column or row at a time.

* The `SortOrder` argument must be exactly `1` (ascending) or `-1` (descending). Any other value returns a `#VALUE!` error.

* Ordering (including mixed types, empty cells, and text collation) follows HyperFormula's own comparison rules, which honor the `caseSensitive` and `accentSensitive` configuration options. Numbers sort before text, and text before logical values.

### LINEST function

* The `stats` argument controls whether the result has one or five rows. It must be omitted or supplied as a constant: `TRUE()`, `FALSE()`, a number, or the text `"TRUE"` or `"FALSE"`. Parentheses and numeric unary signs are supported. Cell references, named expressions, and calculated expressions such as `1=1` return `#VALUE!`, including when `LINEST` is nested inside another function.

* Result width is determined from the predictor dimensions before evaluation. Changes to values within fixed input ranges and to a referenced `const` argument recalculate normally. Changes to dependency values do not resize the result automatically; this is the existing array-sizing limitation.

* If an input expression returns a different predictor count than predicted, `LINEST` returns `#VALUE!`. For example, filtering predictor columns can change the required result width.

* Very large or very small input magnitudes can reduce numerical accuracy. Intermediate calculations, such as residual sums of squares, can still overflow or underflow, producing `#NUM!` or inaccurate statistics. Rescale inputs to more moderate units where possible. See [LINEST numerical differences](list-of-differences.md#linest) for compatibility considerations.

### CHOOSECOLS function

* Column indexes must be supplied as separate scalar arguments. When an array of indexes is passed, only its first index is used: `=CHOOSECOLS(A1:C3, {1,2})` returns column A only. A range of indexes returns `#VALUE!`.

* A whole-column source can spill when the formula is in the first row, regardless of whether the source is on the same sheet. Below the first row, the formula returns `#SPILL!` because its result would extend beyond the worksheet edge; inside another function, such as `=SUM(CHOOSECOLS(A:A, 1))`, it is computed. In the first row, or inside another function, an empty source returns `#N/A` because its effective range is empty. Finite-height sources are supported.

* HyperFormula reserves a dynamic array's predicted spill range before evaluating the formula. If that range is blocked, a runtime error in a source or non-literal column-index expression can therefore be reported as `#SPILL!`. For a source of finite width, errors in literal column indexes are detected before spill allocation.

### CHOOSEROWS function

* Row indexes must be supplied as separate scalar arguments. Passing multiple indexes through an array or range argument is not supported.

* A whole-row source can spill when the formula is in the first column, regardless of whether the source is on the same sheet. A formula outside the first column returns `#SPILL!` because its result would extend beyond the worksheet edge. An empty source returns `#N/A` because its effective range is empty. Finite-width sources are supported.

* HyperFormula reserves a dynamic array's predicted spill range before evaluating the formula. If that range is blocked, a runtime error in a source or non-literal row-index expression can therefore be reported as `#SPILL!`. Errors in literal row indexes are detected before spill allocation.

* A named expression, or a function whose result size depends on cell values, passed directly as the source returns `#VALUE!` when the result has more than one cell, because its size cannot be predicted before evaluation.

### OFFSET function

HyperFormula resolves the OFFSET function at parse time rather than during evaluation. The parser inspects the arguments and rewrites the expression into a plain cell reference or range. This keeps the dependency graph accurate but imposes several restrictions.

* The first argument must be a reference to a single cell. Passing a range causes the cell to store a parser error (the API call itself does not throw — read the error via `getCellValue`).

  ```js
  // Cell A1 stores a parser error — the first argument must be a single cell, not a range
  hf.setCellContents({ sheet: 0, row: 0, col: 0 }, '=OFFSET(A1:B1, 0, 0)');
  ```

* The row-shift, column-shift, height, and width arguments must be static integer literals known at parse time. Cell references and formulas passed as shift or size arguments cause the cell to store a parser error.

  ```js
  // Cell A1 stores a parser error — the row-shift argument must be a static integer literal
  hf.setCellContents({ sheet: 0, row: 0, col: 0 }, '=OFFSET(A1, C3, 0)');
  ```

* The height and width arguments must be bare positive integer literals (the parser accepts only `NUMBER` AST nodes). Unary `+` prefixes, parenthesised expressions, values less than 1, and non-integer values are rejected at parse time.

* When the computed target falls outside the sheet, the parser stores a `#REF!` error in the cell at parse time (rather than during evaluation) with the message *Resulting reference is out of the sheet*.

  ```js
  // Cell A1 stores #REF!
  hf.setCellContents({ sheet: 0, row: 0, col: 0 }, '=OFFSET(A1, -1, 0)');
  ```

* OFFSET is resolved at parse time, so `getCellFormula` returns the computed reference, not the original `OFFSET` call.

  ```js
  const hf = HyperFormula.buildFromArray([[1, 45, '=OFFSET(A1, 0, 1)']], { licenseKey: 'gpl-v3' });
  hf.getCellFormula({ sheet: 0, row: 0, col: 2 }); // '=B1'
  ```
