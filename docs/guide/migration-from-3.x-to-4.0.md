---
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - empty string
  - coercion
---

# Migrating from 3.x to 4.0

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## Changes to empty string coercion

An empty string (`""`) used to be coerced to `0` wherever a number was expected. It no longer is: as in Excel, `""` is text, and text that is not a number produces the `#VALUE!` error. The Excel results quoted below were verified in Excel Online, so where this guide says "as in Excel", that is a measured result rather than an intention.

Nothing in your code needs to change for this on its own. What may change are results in your sheets, and only where an empty string reaches a numeric context — see [When a cell holds an empty string](#when-a-cell-holds-an-empty-string) for the case that is easy to hit without writing `""` anywhere.

### What changes: arithmetic and number-typed arguments

This holds whether the empty string is written in the formula or read from a cell. In the tables below, `A1` is a cell holding an empty string — see [When a cell holds an empty string](#when-a-cell-holds-an-empty-string) for how one gets there.

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=""+0` / `=A1+1` | `0` / `1` | `#VALUE!` |
| `=1-""` / `=A1-1` | `1` / `-1` | `#VALUE!` |
| `=""*2` / `=A1*2` | `0` | `#VALUE!` |
| `=""/1` / `=A1/1` | `0` | `#VALUE!` |
| `=-""` / `=-A1` | `0` | `#VALUE!` |
| `=2^""` / `=A1^2` | `1` / `0` | `#VALUE!` |
| `=""%` / `=A1%` | `0` | `#VALUE!` |
| `=ROUND("", 0)` / `=ROUND(A1, 0)` | `0` | `#VALUE!` |
| `=ABS("")` / `=INT("")` | `0` | `#VALUE!` |
| `=ACOT("")` / `=ACOT(A1)` | `1.5707963268` | `#VALUE!` |
| `=DATE(A1, 2, 3)` | `35` | `#VALUE!` |
| `=LN("")` / `=LOG10("")` / `=LOG("", 42)` | `#NUM!` | `#VALUE!` |
| `=COT("")` / `=COTH("")` | `#DIV/0!` | `#VALUE!` |
| `=DATE("", "", "")` | `#NUM!` | `#VALUE!` |

The `ACOT` and `DATE` rows are the ones worth looking at twice, because they did not fail — they answered. `""` became `0`, and both `ACOT(0)` and `DATE(0, 2, 3)` are perfectly good inputs, so the formulas returned π/2 and a date in 1900 respectively: plausible results computed from an argument that was never a number. The rows below them are the milder shape of the same problem — an error, but one naming a domain violation discovered after the coercion rather than the coercion itself.

### What changes: an empty string written directly into an aggregation

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=COUNT("")` | `1` | `0` |
| `=SUM("")` / `=AVERAGE("")` / `=MIN("")` / `=MAX("")` / `=PRODUCT("")` | `0` | `#VALUE!` |
| `=SUM(1, "")` | `1` | `#VALUE!` |
| `=SUMSQ("")` / `=MEDIAN("")` | `0` | `#VALUE!` |
| `=STDEV("")` | `#DIV/0!` | `#VALUE!` |

`=SUM(1, "")` is the likeliest of these to appear in a real sheet, and it is also the sharpest illustration: one argument is a number, the other never was, and 3.x answered `1`.

`=SUM("abc")` returned `#VALUE!` in 3.x and still does. The point of this change is that `""` is no longer the one text value treated as a number.

### What does NOT change: aggregations over a cell or a range

This is the important half, and the one most likely to be misread. The aggregation functions have always ignored text found in a **cell reference or a range**, and they still do — nothing here changes, and all of it matches Excel:

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=SUM(A1)` / `=MIN(A1)` / `=MAX(A1)` | `0` | `0` (unchanged) |
| `=COUNT(A1)` | `0` | `0` (unchanged) |
| `=AVERAGE(A1)` | `#DIV/0!` | `#DIV/0!` (unchanged) |
| `=COUNTA(A1)` | `1` | `1` (unchanged) |
| `=SUM(A1:C1)` where the range is `1`, `""`, `2` | `3` | `3` (unchanged) |
| `=COUNT(A1:C1)` on the same range | `2` | `2` (unchanged) |

So a sheet whose empty strings only ever reach `SUM`, `COUNT` and their relatives sees no change at all. What breaks is arithmetic and number-typed arguments, per the first table.

### What changes for the better: an empty string produced mid-formula

The most common real shape of this bug was never a literal `""` — it was an expression that produces one. 3.x got all of these wrong; 4.0 matches Excel:

| Formula | Excel | 3.x | 4.0 |
| --- | --- | --- | --- |
| `=SUM(IF(TRUE,"",1))` | `#VALUE!` | `0` | `#VALUE!` |
| `=COUNT(IF(TRUE,"",1))` | `0` | `1` | `0` |
| `=SUM(LEFT("abc",0))` | `#VALUE!` | `0` | `#VALUE!` |
| `=LEFT("abc",0)+1` | `#VALUE!` | `1` | `#VALUE!` |

### One case that moves away from Excel

Where Excel evaluates an argument as an **array containing only text**, it ignores the text and 3.x happened to agree, by way of coercing `""` to `0`:

| Formula | Excel | 3.x | 4.0 |
| --- | --- | --- | --- |
| `=SUM(IF(A1:A3>0,"",A1:A3))` | `0` | `0` | `#VALUE!` |
| `=SUM({""})` | `0` | `0` | `#VALUE!` |
| `=COUNT(IF({1,0},"",5))` | `1` | `1` | `0` |

That agreement was a coincidence rather than support for the idiom: HyperFormula's `IF` is not array-aware, so it collapses such an argument to a single value regardless. `=SUM(IF(A1:A3>5,"",A1:A3))` over `1, 2, 3` is `6` in Excel and `1` in HyperFormula — in 3.x as much as in 4.0. What changes is only that the collapsed value is no longer silently read as `0`. Ranges and array literals with more than one element are unaffected: `=SUM({1,"",2})` is `3` and `=COUNT({1,"",2})` is `2`, before and after.

### Blank cells are not affected

A blank cell is not an empty string, and nothing about it changes:

| Case | 3.x | 4.0 |
| --- | --- | --- |
| `=A1+0` where `A1` is empty | `0` | `0` (unchanged) |
| `=COUNT(A1)` where `A1` is empty | `0` | `0` (unchanged) |
| [`evaluateNullToZero`](../api/interfaces/configparams.md#evaluatenulltozero) | — | behaves exactly as before |
| a `""` criterion in `COUNTIF`/`SUMIF` | matches blank cells only | unchanged |

The `""` criterion row is worth reading twice: `=COUNTIF(A1:A3, "")` matched only genuinely blank cells before this change, and still does. It never matched text cells holding `""`.

### When a cell holds an empty string

This is the case to check in an application, because it can arise without any formula containing `""`.

Writing an empty string into a cell produces a **text** cell, not a blank one:

```js
const hfInstance = HyperFormula.buildFromArray([[]], { licenseKey: 'gpl-v3' });

hfInstance.setCellContents({ sheet: 0, row: 0, col: 0 }, '');    // a text cell holding ''
hfInstance.setCellContents({ sheet: 0, row: 1, col: 0 }, null);  // a blank cell
```

The same distinction applies to `buildFromArray([['']])` versus `buildFromArray([[null]])`.

Only the first one is affected by this change, and only in the contexts of the first table above: `=A1+1` and `=ROUND(A1, 0)` change, `=SUM(A1)` and `=COUNT(A1)` do not. So an application that writes `''` where it means "blank" is not automatically broken — it is exposed only where such a cell feeds arithmetic or a number-typed argument.

**How to migrate.** If your integration clears cells, have it write `null` (or `undefined`) rather than `''`:

```
hfInstance.setCellContents(address, '');    // before
hfInstance.setCellContents(address, null);  // after
```

Two places worth auditing in a host application:

- **A "clear cell" action.** If it hands the engine the empty value of a text input rather than `null`, it writes `''`.
- **Paste.** Clipboard content is text, so a blank cell inside a copied range parses to `''` rather than to `null` unless something maps it back.

To find affected formulas rather than affected code, look for numeric formulas that reference cells your application can blank out, and for `IF(..., "")` used as a "leave it empty" branch feeding another calculation — for example
`=IF(SUM(A1:A2)>0, SUM(A1:A2), "")/1000`, which returned a number in 3.x and returns `#VALUE!` in 4.0. That pattern is Excel-correct in 4.0: Excel reports `#VALUE!` for it too. Where the intent is "treat the empty branch as zero", write `0` instead of `""` in the branch, or wrap the reference in [`N()`](built-in-functions.md#information) / [`IFERROR`](built-in-functions.md#logical).
