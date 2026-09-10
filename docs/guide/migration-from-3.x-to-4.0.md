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

### Every numeric context now rejects an empty string

| Formula | 3.x | 4.0 |
| --- | --- | --- |
| `=""+0` | `0` | `#VALUE!` |
| `=1-""` | `1` | `#VALUE!` |
| `=""*2` | `0` | `#VALUE!` |
| `=""/1` | `0` | `#VALUE!` |
| `=-""` | `0` | `#VALUE!` |
| `=2^""` | `1` | `#VALUE!` |
| `=COUNT("")` | `1` | `0` |
| `=SUM("")` | `0` | `#VALUE!` |
| `=AVERAGE("")` | `0` | `#VALUE!` |
| `=MIN("")` / `=MAX("")` / `=PRODUCT("")` | `0` | `#VALUE!` |
| `=ROUND("", 0)` | `0` | `#VALUE!` |
| `=ACOT("")` | `1.5707963267949` | `#VALUE!` |
| `=LN("")` / `=LOG10("")` / `=LOG("", 42)` | `#NUM!` | `#VALUE!` |
| `=COT("")` / `=COTH("")` | `#DIV/0!` | `#VALUE!` |
| `=DATE("", "", "")` | `#NUM!` | `#VALUE!` |

The `ACOT` row is the one worth looking at twice. `""` became `0`, and `ACOT(0)` is a perfectly good number, so the formula returned π/2 — a plausible result computed from an argument that was never a number. The rows below it are the milder shape of the same problem: an error, but one naming a domain violation discovered after the coercion rather than the coercion itself.

`=SUM("abc")` returned `#VALUE!` in 3.x and still does. The point of this change is that `""` is no longer the one text value treated as a number.

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
hfInstance.setCellContents({ sheet: 0, col: 0, row: 0 }, '');    // a text cell holding ''
hfInstance.setCellContents({ sheet: 0, col: 0, row: 0 }, null);  // a blank cell
```

The first is `#VALUE!`-producing input for a numeric formula from 4.0 on; the second is not, and never was. The same distinction applies to `buildFromArray([['']])` versus `buildFromArray([[null]])`.

**How to migrate.** If your integration clears cells, make sure it writes `null` (or `undefined`), not `''`:

```js
hfInstance.setCellContents(address, '');    ->  hfInstance.setCellContents(address, null);
```

Two places worth auditing in a host application:

- **A "clear cell" action.** If it hands the engine the empty value of a text input rather than `null`, it writes `''`.
- **Paste.** Clipboard content is text, so a blank cell inside a copied range parses to `''` rather than to `null` unless something maps it back.

To find affected formulas rather than affected code, look for numeric formulas that reference cells your application can blank out, and for `IF(..., "")` used as a "leave it empty" branch feeding another calculation — for example
`=IF(SUM(A1:A2)>0, SUM(A1:A2), "")/1000`, which returned a number in 3.x and returns `#VALUE!` in 4.0. That pattern is Excel-correct in 4.0: Excel reports `#VALUE!` for it too. Where the intent is "treat the empty branch as zero", write `0` instead of `""` in the branch, or wrap the reference in [`N()`](built-in-functions.md) / `IFERROR`.
