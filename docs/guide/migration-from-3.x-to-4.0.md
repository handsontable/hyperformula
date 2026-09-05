---
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - INDEX
  - arrays
  - spilling
---

# Migrating from 3.x to 4.0

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## Changes to the INDEX function

`INDEX` was reworked to behave the way Microsoft Excel does. The new behaviour was verified against Excel formula by formula, so where this guide says "as in Excel", that is a measured result rather than an intention.

Nothing in your code needs to change. What may need to change are the **formulas in your sheets**, and only those using `INDEX` in one of the ways described below. `=INDEX(range, row, column)` with all three arguments given and both indices in range is unaffected — that is the overwhelming majority of uses, including the `INDEX`/`MATCH` pattern `=INDEX(A1:A10, MATCH(...))`.

### Leaving the column argument out now requires a one-dimensional range

Previously the third argument defaulted to `1`, so a two-argument call returned a value from the first column. It now follows Excel: the range has to be a single row or a single column, and the only index given is read as the position along it.

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=INDEX(A1:A3, 2)` | value of `A2` | value of `A2` (unchanged) |
| `=INDEX(A1:C1, 3)` | `#NUM!` | value of `C1` |
| `=INDEX(A1:C3, 2)` | value of `A2` | `#REF!` |

The last row is the one to look for. On a range with several rows **and** several columns there is nothing for a single index to mean, so Excel — and now HyperFormula — reports `#REF!`.

**How to migrate.** Add the missing column number:

```
=INDEX(A1:C3, 2)      ->  =INDEX(A1:C3, 2, 1)
```

To find the affected formulas, look for `INDEX` calls with exactly two arguments whose range spans more than one column and more than one row.

### An empty column argument is a zero, not an omission

`=INDEX(A1:C1, 3, )` is not the same as `=INDEX(A1:C1, 3)`. The empty argument is a column number of `0`, which asks for the whole third row, and a one-row range has no third row:

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=INDEX(A1:C1, 3, )` | `#NUM!` | `#REF!` |
| `=INDEX(A1:C3, 2, )` | `#VALUE!` | the whole second row |

### An index of 0 returns a whole row, column or range

This is new capability rather than a change to a working formula: `0` used to be rejected outright.

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=INDEX(A1:C3, 2, 0)` | `#VALUE!` | the whole second row |
| `=INDEX(A1:C3, 0, 2)` | `#VALUE!` | the whole second column |
| `=INDEX(A1:C3, 0, 0)` | `#VALUE!` | the whole range |

A result spanning more than one cell is an array, so it needs free cells to spill into and will report `#SPILL!` if they are occupied. It also has to be a shape HyperFormula can determine before evaluating the formula — see [known limitations](known-limitations.md#index-function) for when that is not the case.

### Error values have changed

| Situation | 3.x | 4.0 |
| --- | --- | --- |
| index past the end of the range | `#NUM!` "Value too large." | `#REF!` "Index out of bounds." |
| negative index | `#VALUE!` "Argument cannot be less than 1." | `#VALUE!` "Value cannot be negative." |

Both match Excel. If your application branches on the error type — for example with `IFNA`, or by reading `CellError.type` from the API — an out-of-range `INDEX` now raises `ErrorType.REF` instead of `ErrorType.NUM`. The negative-index case keeps `ErrorType.VALUE` and only its message changed.

### A fractional index is truncated

`=INDEX(A1:C3, 2.9, 1)` returned the value of `A1` in 3.x. It now truncates the index toward zero and returns the value of `A2`, as Excel does. A formula relying on the old result was relying on a bug.

### INDEX is no longer vectorized

With [array arithmetic](arrays.md) enabled, passing an array as an index used to produce one result per element:

| Formula (`useArrayArithmetic: true`) | 3.x | 4.0 |
| --- | --- | --- |
| `=INDEX(A1:C3, {1,2}, 1)` | `1, 4` | `1` |

The array is now resolved to a single value, which is what already happened with array arithmetic disabled. This is a divergence from Excel, which does return `1, 4`, and it is recorded in the [list of differences](list-of-differences.md). It is necessary because a vectorized call evaluates the function once per element and cannot hold the array that an index of `0` produces.

If you depend on the old behaviour, write the call so that each index is a separate formula, or use [`ARRAYFORMULA`](built-in-functions.md) over the individual results.
