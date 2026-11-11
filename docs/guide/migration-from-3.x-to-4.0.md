---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - INDEX
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `INDEX` function

HyperFormula 4.0 changes the `INDEX` function to return what Microsoft Excel returns:

| Case | Example | 3.x | 4.0 |
|:-----|:--------|:----|:----|
| A row or column past the range | `=INDEX(A1:C3, 4, 1)` | `#NUM!` | `#REF!` |
| A fractional row or column | `=INDEX(A1:C3, 2.9, 1)` | The value of `A1` | The value of `A2`: `2.9` truncates to `2` |
| A row of `0` | `=INDEX(A1:C3, 0, 2)` | `#VALUE!` | `B1:B3`, spilled |
| A column of `0` or an empty column argument | `=INDEX(A1:C3, 2, 0)`, `=INDEX(A1:C3, 2, )` | `#VALUE!` | `A2:C2`, spilled |
| No column, on a range with more than one row and column | `=INDEX(A1:C3, 2)` | The value of `A2` | `#REF!` |
| No column, on a one-row range | `=INDEX(A1:C1, 3)` | `#NUM!` | The value of `C1` |
| The `area_num` argument | `=INDEX(A1:C3, 1, 1, 1)` | `#N/A` (wrong number of arguments) | The value of `A1` |

A spilled result needs empty cells to spill into, or it returns `#SPILL!`. If your code checks for `ErrorType.NUM` from `INDEX`, check for `ErrorType.REF` instead.
