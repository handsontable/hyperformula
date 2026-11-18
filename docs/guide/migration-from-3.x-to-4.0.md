---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - TEXT
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `TEXT` function

HyperFormula 4.0 changes how the `TEXT` function reads its number format mask, the second argument. Some formulas that returned text in 3.x return a different text, or `#VALUE!`, in 4.0.

In a mask, `.` is always the decimal point and `,` is always thousands grouping, whatever separators you configure.

### Separators in the result

`TEXT` writes the decimal point from the [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) option and groups thousands with the [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) option. In 3.x, it always wrote `.`.

With `decimalSeparator: ','`, `thousandSeparator: ' '` and `functionArgSeparator: ';'`:

| Formula | 3.x | 4.0 |
|:--------|:----|:----|
| `=TEXT(1,5; "0.00")` | `1.50` | `1,50` |
| `=TEXT(1,5; "0,00")` | `2,00` | `002` |

To keep `.` in the result, keep the default `decimalSeparator: '.'`, or replace the separator in the result: `=SUBSTITUTE(TEXT(1,5; "0.00"); ","; ".")` returns `1.50`. Write the decimal point of a mask as `.`: `"0,00"` is a grouping mask, not a mask with two decimal places.

### Masks that return `#VALUE!`

A mask with an unclosed `[` or `"`, or with `\` as its last character, returns `#VALUE!`. In 3.x, `TEXT` wrote these characters as text.

| Mask | Formula | 3.x | 4.0 |
|:-----|:--------|:----|:----|
| `0[` | `=TEXT(5, "0[")` | `5[` | `#VALUE!` |
| `0"x`, in `B1` | `=TEXT(5, B1)` | `5"x` | `#VALUE!` |
| `0\`, in `B1` | `=TEXT(5, B1)` | `5\` | `#VALUE!` |

To write one of these characters as text, put `\` before it, or close the quoted text. In 4.0, `=TEXT(5, "0\[")` returns `5[`, and the mask `0"x"` returns `5x`.

### Masks with `,` and `#`

`TEXT` reads `,` between digit placeholders as thousands grouping, and `#` as a digit that is written only when it is significant. Masks that used these characters in other ways return a different result:

| Formula | 3.x | 4.0 | To get the 3.x result |
|:--------|:----|:----|:----------------------|
| `=TEXT(5, "0,000")` | `5,000` | `0005` | `=TEXT(5, "0")&",000"` |
| `=TEXT(0.5, "#.00")` | `0.50` | `.50` | `=TEXT(0.5, "0.00")` |
| `=TEXT(0, "#")` | `0` | The empty text | `=TEXT(0, "0")` |

`=TEXT(5, "0,000")` returns `0005` because the default `thousandSeparator` is the empty text, so grouping writes no character. With `thousandSeparator: ','` and `functionArgSeparator: ';'`, `=TEXT(5; "0,000")` returns `0,005`.

### Custom `stringifyDateTime` and `stringifyDuration` callbacks

A [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) or [`stringifyDuration`](../api/interfaces/configparams.md#stringifyduration) callback receives the mask without its color tag, such as `[Red]`. HyperFormula does not call either callback for a mask that returns `#VALUE!`.

| Mask | 3.x: the callback receives | 4.0: the callback receives |
|:-----|:---------------------------|:---------------------------|
| `[Red]dd-mm-yyyy` | `[Red]dd-mm-yyyy` | `dd-mm-yyyy` |
| `[Blue][h]:mm` | `[Blue][h]:mm` | `[h]:mm` |
| `dd-mm-yyyy[` | `dd-mm-yyyy[` | Nothing: the callback is not called, and `TEXT` returns `#VALUE!` |

A callback that removed color tags itself keeps working. A callback that read the color from the mask no longer receives it.
