---
title: "Migrating from 3.x to 4.0"
description: "Upgrade HyperFormula from version 3.x to 4.0, which requires a commercial license key."
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - "#LIC!"
  - language packs
  - INDEX
  - FILTER
  - TEXT
  - evaluateNullToZero
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `gpl-v3` license key no longer works

HyperFormula 4.0.0 is available only under a commercial license. It no longer accepts the `gpl-v3` license key.
For the background of this change, see [HyperFormula is moving from GPLv3 to a proprietary license](https://github.com/handsontable/hyperformula/issues/1888).

With `licenseKey: 'gpl-v3'`, HyperFormula 4.0.0 reads the key as invalid:

* Every function call evaluates to a `#LIC!` error, except `VERSION()` and `OFFSET()`.
* License-gated API methods throw a `LicenseCapabilityMissingError`.
* You see a warning in the console.

For details, see [Invalid license key](license-key.md#invalid-license-key).

### Get a license key

For a commercial license key or a free trial, contact us via [handsontable.com/pricing](https://handsontable.com/pricing/?tab=hyperformula).

Then, in your [configuration options](configuration-options.md), replace `gpl-v3` with your license key:

```js
const hf = HyperFormula.buildEmpty({
  // replace 'your-license-key' with your license key
  licenseKey: 'your-license-key',
});
```

### Keep using `gpl-v3`

To keep using the `gpl-v3` license key, don't upgrade: stay on HyperFormula 3.5.0, which won't be maintained any more.
HyperFormula 3.5.0 and earlier versions remain available under the GNU General Public License v3.0 (GPLv3).

## The `#CALC!` error

HyperFormula 4.0 adds the `#CALC!` error (`ErrorType.CALC`). Like Microsoft Excel, HyperFormula returns it when a function cannot calculate its result, for example when the result would be an empty array. See [Types of errors](types-of-errors.md).

### Custom language packs

Every language pack must translate the new `CALC` error. The built-in language packs already do. A custom language pack without `errors.CALC` makes `registerLanguage()` throw a `MissingTranslationError`.

Add the entry to the `errors` object of your language pack:

```javascript
errors: {
  CALC: '#CALC!',
  // ...
},
```

If Microsoft Excel shows the error under a different name in your language, use that name instead, for example `#OBL!` in Polish.

### Functions that return `#CALC!`

| Function | Case | 3.x | 4.0 |
|:---------|:-----|:----|:----|
| `FILTER` | No value meets the conditions. | `#N/A` | `#CALC!` |
| `UNIQUE` | No row or column is kept: `exactly_once` is `TRUE` and every row or column occurs more than once. | `#N/A` | `#CALC!` |
| `SEQUENCE` | The number of rows or columns is 0 or truncates to 0, for example `0`, `0.5`, `FALSE()` or an empty cell. | `#VALUE!` | `#CALC!` |
| `TEXTJOIN` | The result is longer than 32,767 characters. | `#VALUE!` | `#CALC!` |

`CONCAT`, new in 4.0, also returns `#CALC!` when the result is longer than 32,767 characters.

Formulas that handle these errors with `IFNA()` or `ISNA()` no longer catch them. Use `IFERROR()` or `ISERROR()` instead. Likewise, if your code checks a cell's error type, check for `ErrorType.CALC` in these cases.

## The `INDEX` function

HyperFormula 4.0 changes the `INDEX` function to return what Microsoft Excel returns:

| Case | Example | 3.x | 4.0 |
|:-----|:--------|:----|:----|
| A row or column past the range | `=INDEX(A1:C3, 4, 1)` | `#NUM!` | `#REF!` |
| A fractional row or column | `=INDEX(A1:C3, 2.9, 1)` | The value of `A1` | The value of `A2`: `2.9` truncates to `2` |
| A row of `0` | `=INDEX(A1:C3, 0, 2)` | `#VALUE!` | `B1:B3`, spilled |
| A column of `0` or an empty column argument | `=INDEX(A1:C3, 2, 0)`, `=INDEX(A1:C3, 2, )` | `#VALUE!` | `A2:C2`, spilled |
| No column, on a range with more than one row and column | `=INDEX(A1:C3, 2)` | The value of `A2` | `#REF!` |
| No column, on an array with more than one row and column | `=INDEX({1,2;3,4}, 2)` | `3` | `{3,4}`, spilled |
| No column, on a one-row range | `=INDEX(A1:C1, 3)` | `#NUM!` | The value of `C1` |
| The `area_num` argument | `=INDEX(A1:C3, 1, 1, 1)` | `#N/A` (wrong number of arguments) | The value of `A1` |

A spilled result needs empty cells to spill into, or it returns `#SPILL!`. If your code checks for `ErrorType.NUM` from `INDEX`, check for `ErrorType.REF` instead.

## The `FILTER` function

HyperFormula 4.0 reads the `include` argument of `FILTER`, its second argument, as Microsoft Excel does. Text in it returns `#VALUE!`, and an error in it is returned:

| Value in `include` | 3.x | 4.0 |
|:-------------------|:----|:----|
| `TRUE`, a non-zero number | The row is kept | The row is kept |
| `FALSE`, `0`, a blank cell | The row is dropped | The row is dropped |
| Text, such as `"x"` or the empty text `""` | The row is dropped | `#VALUE!` |
| The text `"TRUE"` | The row is kept | `#VALUE!` |
| An error, such as `#DIV/0!` | The row is dropped | The error |

If a condition column can hold text, for example `=IF(B1>0, TRUE(), "")`, return `FALSE()` instead of `""`. Conditions after `include`, which HyperFormula accepts in addition to Excel, still drop such rows.

## Function names in the Polish and Turkish language packs

HyperFormula 4.0 changes two function names to the ones Microsoft Excel uses:

| Language pack | Name | 3.x | 4.0 |
|:--------------|:-----|:----|:----|
| `plPL` | `ROCZ.PRZYCH` | `PDURATION` | `DURATION` |
| `plPL` | `O.CZAS.TRWANIA` | `#NAME?` | `PDURATION` |
| `trTR` | `DEĞER` | `VALUE` | `PRICE` |
| `trTR` | `SAYIYAÇEVİR` | `#NAME?` | `VALUE` |

A Polish or Turkish formula with an old name now calls `DURATION` or `PRICE`, which take different arguments, so it returns `#N/A`. In the formulas you store in these languages, replace `ROCZ.PRZYCH` with `O.CZAS.TRWANIA`, and `DEĞER` with `SAYIYAÇEVİR`. Formulas in other languages are not affected.

## The `TEXT` function

HyperFormula 4.0 changes how the `TEXT` function reads its number format mask, the second argument. Some formulas that returned text in 3.x return a different text, or `#VALUE!`, in 4.0.

### Separators in the mask and the result

`TEXT` reads the [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) character as the decimal point of the mask and the [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) character as thousands grouping, and writes them in the result. When `thousandSeparator` is empty, as by default, `,` is the grouping character if `decimalSeparator` is `.`, and no character groups if it is `,`. A `.` or `,` that is neither separator is text. In 3.x, `TEXT` always read `.` as the decimal point of the mask and wrote `.` in the result.

With `decimalSeparator: ','`, `thousandSeparator: ' '` and `functionArgSeparator: ';'`:

| Formula | 3.x | 4.0 |
|:--------|:----|:----|
| `=TEXT(1,5; "0,00")` | `2,00` | `1,50` |
| `=TEXT(1,5; "0.00")` | `1.50` | `2.00` |
| `=TEXT(1234,5; "# ##0,00")` | `1235 ##0,00` | `1 234,50` |

With `decimalSeparator: ','` and the default empty `thousandSeparator`, `=TEXT(5; "0,000")` returns `5,000`, as in 3.x, because `,` is the decimal point.

Write the decimal point and grouping of a mask with the separators you configure: with `decimalSeparator: ','`, replace `"0.00"` with `"0,00"`. To keep `.` in the result, keep the default `decimalSeparator: '.'`, or replace the separator in the result: `=SUBSTITUTE(TEXT(1,5; "0,00"); ","; ".")` returns `1.50`.

### Masks that return `#VALUE!`

A mask with an unclosed `[` or `"`, an empty bracket `[]`, a bracket that starts with `\`, or `\` as its last character, returns `#VALUE!`. In 3.x, `TEXT` wrote these characters as text.

| Mask | Formula | 3.x | 4.0 |
|:-----|:--------|:----|:----|
| `0[` | `=TEXT(5, "0[")` | `5[` | `#VALUE!` |
| `0"x`, in `B1` | `=TEXT(5, B1)` | `5"x` | `#VALUE!` |
| `0\`, in `B1` | `=TEXT(5, B1)` | `5\` | `#VALUE!` |
| `0[]` | `=TEXT(5, "0[]")` | `5[]` | `#VALUE!` |
| `0[\]`, in `B1` | `=TEXT(5, B1)` | `5[\]` | `#VALUE!` |

To write one of these characters as text, put `\` before it, or close the quoted text. In 4.0, `=TEXT(5, "0\[")` returns `5[`, and the mask `0"x"` returns `5x`.

### Masks with `,` and `#`

On the default config, `TEXT` reads `,` between digit placeholders as thousands grouping, and `#` as a digit that is written only when it is significant. Masks that used these characters in other ways return a different result:

| Formula | 3.x | 4.0 | To get the 3.x result |
|:--------|:----|:----|:----------------------|
| `=TEXT(5, "0,000")` | `5,000` | `0,005` | `=TEXT(5, "0")&",000"` |
| `=TEXT(0.5, "#.00")` | `0.50` | `.50` | `=TEXT(0.5, "0.00")` |
| `=TEXT(0, "#")` | `0` | The empty text | `=TEXT(0, "0")` |

These are results on the default config, where `.` is the decimal point and `,` groups thousands. With other separators, use the configured characters in place of `.` and `,`.

### Custom `stringifyDateTime` and `stringifyDuration` callbacks

A [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) or [`stringifyDuration`](../api/interfaces/configparams.md#stringifyduration) callback receives the mask without its color tag, such as `[Red]`. HyperFormula does not call either callback for a mask that returns `#VALUE!`.

| Mask | 3.x: the callback receives | 4.0: the callback receives |
|:-----|:---------------------------|:---------------------------|
| `[Red]dd-mm-yyyy` | `[Red]dd-mm-yyyy` | `dd-mm-yyyy` |
| `[Blue][h]:mm` | `[Blue][h]:mm` | `[h]:mm` |
| `dd-mm-yyyy[` | `dd-mm-yyyy[` | Nothing: the callback is not called, and `TEXT` returns `#VALUE!` |

A callback that removed color tags itself keeps working. A callback that read the color from the mask no longer receives it.

## Empty cells with `evaluateNullToZero`

This section applies only if you set the [`evaluateNullToZero`](../api/interfaces/configparams.md#evaluatenulltozero) option to `true`. With the default `false`, nothing changes.

In 3.x, `evaluateNullToZero` made formulas read an empty cell as `0`, but the HyperFormula API still returned `null` for the empty cell itself. HyperFormula 4.0 returns `0` for it, so the API gives the same value that formulas see.

### What changes

With `evaluateNullToZero: true`, `B1` empty, and `A2:C2` holding `1`, `2` and `3`:

```js
const hf = HyperFormula.buildFromArray([
  [1],
  [1, 2, 3],
], {
  licenseKey: 'your-license-key',
  evaluateNullToZero: true,
});
```

| Call | 3.x | 4.0 |
|:-----|:----|:----|
| `hf.getCellValue({ sheet: 0, row: 0, col: 1 })` | `null` | `0` |
| `hf.getCellValue()` for an address outside the sheet's used area | `null` | `0` |
| `hf.getSheetValues(0)` | `[[1], [1, 2, 3]]` | `[[1, 0, 0], [1, 2, 3]]` |
| `hf.getAllSheetsValues()` | `{ Sheet1: [[1], [1, 2, 3]] }` | `{ Sheet1: [[1, 0, 0], [1, 2, 3]] }` |
| `hf.getRangeValues()` for `A1:B1` | `[[1, null]]` | `[[1, 0]]` |
| `hf.calculateFormula('=A1:C1', 0)` | `[[1, null, null]]` | `[[1, 0, 0]]` |
| The `newValue` of a cell cleared with `setCellContents()`, in the returned changes and the `valuesUpdated` event | `null` | `0` |

`getSheetValues()` and `getAllSheetsValues()` fill each row with `0` up to the width of the sheet, instead of ending the row at its last non-empty cell.

These stay the same in 4.0:

* `hf.getCellSerialized()` returns `null` for an empty cell.
* `hf.isCellEmpty()` returns `true`, and `hf.getCellType()` returns `CellType.EMPTY`, for an empty cell.
* `=ISBLANK(B1)` returns `TRUE`.
* Formulas that read an empty cell get `0`, as in 3.x.

### Update your code

In 4.0, with `evaluateNullToZero: true`, a value of `0` can mean either an empty cell or a cell that holds `0`. Code that checks for `null` to find empty cells no longer finds them.

To find empty cells, use [`isCellEmpty()`](../api/classes/hyperformula.md#iscellempty) instead of comparing the value with `null`:

```js
// 3.x
const isEmpty = hf.getCellValue(address) === null;

// 4.0
const isEmpty = hf.isCellEmpty(address);
```

If your code reads the rows of `getSheetValues()` or `getAllSheetsValues()`, expect every row to be as wide as the sheet. To tell the padding apart from a `0` in a cell, use `isCellEmpty()` or [`getCellSerialized()`](../api/classes/hyperformula.md#getcellserialized), which still returns `null` for an empty cell.
