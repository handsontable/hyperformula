# Compatibility with Microsoft Excel

Achieve nearly full compatibility wih Microsoft Excel, using the right HyperFormula configuration.

**Contents:**
[[toc]]

## Overview

While HyperFormula conforms to the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html) standard, it also follows industry practices set by other spreadsheets such as Microsoft Excel or Google Sheets.

That said, there are cases when HyperFormula can't be compatible with all three at the same time, because of inconsistencies (between the OpenDocument standard, Microsoft Excel and Google Sheets), limitations of HyperFormula at its current development stage (version `{{ $page.version }}`), or limitations of Microsoft Excel or Google Sheets themselves. For the full list of such differences, see [this](list-of-differences.md) page.

Still, with the right configuration, you can achieve nearly full compatibility.

## Configure compatibility with Microsoft Excel

### String comparison rules

In the US version of Microsoft Excel, by default, [string comparison](types-of-operators.md#comparing-strings) is accent-sensitive and case-insensitive.

To set up HyperFormula in the same way, use this configuration:

```js
caseSensitive: false, // set by default
accentSensitive: true,
ignorePunctuation: false, // set by default
localeLang: 'en-US',
```

Related options:
- [`caseSensitive`](../api/interfaces/configparams.md#casesensitive)
- [`accentSensitive`](../api/interfaces/configparams.md#accentsensitive)
- [`caseFirst`](../api/interfaces/configparams.md#casefirst)
- [`ignorePunctuation`](../api/interfaces/configparams.md#ignorepunctuation)
- [`localeLang`](../api/interfaces/configparams.md#localelang)

### Function criteria

In Microsoft Excel, functions that use criteria (`SUMIF`, `SUMIFS`, `COUNTIF` etc.) accept wildcards, don't accept regular expressions, and require whole cells to match the specified pattern.

To set up HyperFormula in the same way, use the default configuration:

```js
useWildcards: true, // set by default
useRegularExpressions: false, // set by default
matchWholeCell: true, // set by default
```

Related options:
- [`matchWholeCell`](../api/interfaces/configparams.md#matchwholecell)
- [`useRegularExpressions`](../api/interfaces/configparams.md#useregularexpressions)
- [`useWildcards`](../api/interfaces/configparams.md#usewildcards)

### `TRUE` and `FALSE` constants

Microsoft Excel has built-in constants (keywords) for the boolean values (`TRUE` and `FALSE`).

To set up HyperFormula in the same way, define `TRUE` and `FALSE` as [named expressions](named-expressions.md), by using HyperFormula's [`TRUE`](built-in-functions.md#logical) and [`FALSE`](built-in-functions.md#logical) functions.

```js
hfInstance.addNamedExpression('TRUE', '=TRUE()');
hfInstance.addNamedExpression('FALSE', '=FALSE()');
```

### Array arithmetic mode

In Microsoft Excel, the [array arithmetic mode](arrays.md#array-arithmetic-mode) is enabled by default.

To set up HyperFormula in the same way, set the [`useArrayArithmetic`](../api/interfaces/configparams.md#usearrayarithmetic) option to `true`.

```js
useArrayArithmetic: true,
```

### Whitespace in formulas

In Microsoft Excel, all whitespace characters inside formulas are ignored.

To set up HyperFormula in the same way, set the [`ignoreWhiteSpace`](../api/interfaces/configparams.md#ignorewhitespace) option to `'any'`.

```js
ignoreWhiteSpace: 'any',
```

### Formulas that evaluate to `null`

In Microsoft Excel, formulas that evaluate to empty values are forced to evaluate to zero instead.

To set up HyperFormula in the same way, set the [`evaluateNullToZero`](../api/interfaces/configparams.md#evaluatenulltozero) option to `true`.

```js
evaluateNullToZero: true,
```

### Leap year bug

In Microsoft Excel, the year 1900 is [incorrectly](https://docs.microsoft.com/en-us/office/troubleshoot/excel/wrongly-assumes-1900-is-leap-year) treated as a leap year.

To set up HyperFormula in the same way, use this configuration:

```js
leapYear1900: true,
nullDate: { year: 1899, month: 12, day: 31 },
```

### Numerical precision

Both HyperFormula and Microsoft Excel automatically round floating-point numbers. To configure this feature, use these options:
- [`smartRounding`](../api/interfaces/configparams.md#smartrounding)
- [`precisionEpsilon`](../api/interfaces/configparams.md#precisionepsilon)

### Separators

In Microsoft Excel, separators depend on your configured locale, whereas in HyperFormula, you set up separators through options (e.g., [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)).

In Excel's  `en-US` locale, the thousands separator and the function argument separator use the same character: `,` (a comma). But in HyperFormula, [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator) can't be the same as [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator). For this reason, you can't achieve full compatibility with Excel's `en-US` locale.

To match Excel's `en-US` locale as closely as possible, use the default configuration:

```js
functionArgSeparator: ',', // set by default
decimalSeparator: '.', // set by default
thousandSeparator: '', // set by default
arrayColumnSeparator: ',', // set by default
arrayRowSeparator: ';', // set by default
```

Related options:
- [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator)
- [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)
- [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator)
- [`arrayRowSeparator`](../api/interfaces/configparams.md#arrayrowseparator)
- [`arrayColumnSeparator`](../api/interfaces/configparams.md#arraycolumnseparator)

### Date and time formats

In Microsoft Excel, date and time formats depend on your configured locale, whereas in HyperFormula you can [set them up freely](date-and-time-handling.md).

Options related to date and time formats:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats)
- [`timeFormats`](../api/interfaces/configparams.md#timeformats)
- [`nullYear`](../api/interfaces/configparams.md#nullyear)
- [`parseDateTime()`](../api/interfaces/configparams.md#parsedatetime)
- [`stringifyDateTime()`](../api/interfaces/configparams.md#stringifydatetime)
- [`stringifyDuration()`](../api/interfaces/configparams.md#stringifyduration)

## Full configuration

This configuration aligns HyperFormula with the default behavior of Microsoft Excel (set to locale `en-US`), as closely as possible at this development stage (version `{{ $page.version }}`).

```js
// define options
const options = {
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
  currencySymbol: ['$', 'USD'],
  localeLang: 'en-US',
  functionArgSeparator: ',', // set by default
  decimalSeparator: '.', // set by default
  thousandSeparator: '', // set by default
  arrayColumnSeparator: ',', // set by default
  arrayRowSeparator: ';', // set by default
  nullYear: 30, // set by default
  caseSensitive: false, // set by default
  accentSensitive: true,
  ignorePunctuation: false, // set by default
  useWildcards: true, // set by default
  useRegularExpressions: false, // set by default
  matchWholeCell: true, // set by default
  useArrayArithmetic: true,
  ignoreWhiteSpace: 'any',
  evaluateNullToZero: true,
  leapYear1900: true,
  nullDate: { year: 1899, month: 12, day: 31 },
  smartRounding: true, // set by default
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);

// define TRUE and FALSE constants
hfInstance.addNamedExpression('TRUE', '=TRUE()');
hfInstance.addNamedExpression('FALSE', '=FALSE()');
```
