---
tags:
  - unsupported features
  - multiple workbooks
  - 3D references
  - dynamic arrays
  - asynchronous functions
  - structured references
---

# Known limitations

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
* The FILTER function accepts either single rows of equal width or single columns of equal height. In other words, all arrays passed to the FILTER function must have equal dimensions, and at least one of those dimensions must be 1.
* Array-producing functions (e.g., SEQUENCE, FILTER, INDEX) require their output dimensions to be determinable at parse time. Passing cell references or formulas as dimension arguments (e.g., `=SEQUENCE(A1)`) results in a `#VALUE!` error, because the output size cannot be resolved before evaluation.
* The TEXT function does not accept embedded double-quote literals in the format string. In Excel, `""` inside a format string is an escape sequence for a literal `"` character — e.g. `=TEXT(1234.5, "#,##0.00 ""zł""")` returns `"1,234.50 zł"`. If your application requires this escape sequence, supply a custom [`stringifyCurrency`](currency-handling.md) callback.

### INDEX function

* A `row` or `column` argument of 0 returns a whole row, a whole column or the whole range. Such a result is an array, and space for an array is reserved before the formula is evaluated, so the result spills into the sheet only when its shape follows from the formula alone. That needs two things: both index arguments written as literal numbers or omitted, and a range whose size is known statically. The second holds for a plain cell range and an array literal, but not for a named expression, an unbounded range such as `A:A`, or most function results.

* When the shape does not follow from the formula, the result is still computed and can be consumed by an enclosing function — `=SUM(INDEX(A1:C3, B1, 0))` sums the whole row — but on its own the formula returns a `#VALUE!` error, because no room was reserved for the array. This is why `=INDEX(A1:C3, B1, 0)`, `=INDEX(myNamedRange, 2)` and `=INDEX(A:A, 0, 1)` report `#VALUE!` where Excel spills.

* INDEX returns values, not a reference, so it cannot be used as an endpoint of a range. Excel's `=SUM(A1:INDEX(A1:A10, 5))` is a parsing error in HyperFormula. Use [OFFSET](#offset-function) to build a range dynamically.

* Excel's reference form of the function, `INDEX(reference, row_num, column_num, area_num)`, is not supported. HyperFormula has no multi-area references, so `area_num` would have nothing to select from, and a fourth argument returns a `#N/A` error.

* INDEX is not [vectorized](arrays.md#passing-arrays-to-scalar-functions-vectorization). An array passed as an index argument is resolved to a single value rather than producing one result per element, because a vectorized call cannot hold the array that a zero index returns.

### UNIQUE function

* Comparison of values follows HyperFormula's own equality rules, which honor the `caseSensitive` and `accentSensitive` configuration options. By default comparison is case-insensitive.

* When `ExactlyOnce` is TRUE and no row or column occurs exactly once, `UNIQUE` returns a `#N/A` error (the result would otherwise be empty).
### SORT function

* The `SortIndex` argument accepts a single key only. Multi-key sorting through an array constant (for example `=SORT(A1:B9, {1,2})`) is not supported; sort by one column or row at a time.

* The `SortOrder` argument must be exactly `1` (ascending) or `-1` (descending). Any other value returns a `#VALUE!` error.

* Ordering (including mixed types, empty cells, and text collation) follows HyperFormula's own comparison rules, which honor the `caseSensitive` and `accentSensitive` configuration options. Numbers sort before text, and text before logical values.

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
  const hf = HyperFormula.buildFromArray([[1, 45, '=OFFSET(A1, 0, 1)']]);
  hf.getCellFormula({ sheet: 0, row: 0, col: 2 }); // '=B1'
  ```
