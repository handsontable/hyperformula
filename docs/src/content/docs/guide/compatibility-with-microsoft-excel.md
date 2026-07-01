---
title: "Compatibility with Microsoft Excel"
---


Achieve nearly full compatibility with Microsoft Excel, using the right HyperFormula configuration.

**Contents:**


## Overview

While HyperFormula conforms to the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html) standard, it also follows industry practices set by other spreadsheets such as Microsoft Excel or Google Sheets.

That said, there are cases when HyperFormula can't be compatible with all three at the same time, because of inconsistencies (between the OpenDocument standard, Microsoft Excel and Google Sheets), limitations of HyperFormula at its current development stage (version `3.3.0`), or limitations of Microsoft Excel or Google Sheets themselves. For the full list of such differences, see [this](/docs/guide/list-of-differences) page.

Still, with the right configuration, you can achieve nearly full compatibility.

### Excel function coverage

HyperFormula implements **350 out of 515 Excel functions** (68% coverage), as of version 3.1.0 and Excel 2024. This means that **165 Excel functions** (32%) are not yet available in HyperFormula.

Additionally, HyperFormula includes some functions that are not part of Excel's standard function set, bringing the total number of available functions to **418**.

For a complete list of supported functions, see the [built-in functions](/docs/guide/built-in-functions) page.

If you need any of the missing Excel functions, you can [contact us](/docs/guide/contact) or implement them as [custom functions](/docs/guide/custom-functions), extending HyperFormula's capabilities to meet your specific requirements.


## Configure compatibility with Microsoft Excel

### String comparison rules

In the US version of Microsoft Excel, by default, [string comparison](/docs/guide/types-of-operators#comparing-strings) is accent-sensitive and case-insensitive.

To set up HyperFormula in the same way, use this configuration:

```js
caseSensitive: false, // set by default
accentSensitive: true,
ignorePunctuation: false, // set by default
localeLang: 'en-US',
```

Related options:
- [`caseSensitive`](/docs/api/interfaces/configparams#casesensitive)
- [`accentSensitive`](/docs/api/interfaces/configparams#accentsensitive)
- [`caseFirst`](/docs/api/interfaces/configparams#casefirst)
- [`ignorePunctuation`](/docs/api/interfaces/configparams#ignorepunctuation)
- [`localeLang`](/docs/api/interfaces/configparams#localelang)

### Function criteria

In Microsoft Excel, functions that use criteria (`SUMIF`, `SUMIFS`, `COUNTIF` etc.) accept wildcards, don't accept regular expressions, and require whole cells to match the specified pattern.

To set up HyperFormula in the same way, use the default configuration:

```js
useWildcards: true, // set by default
useRegularExpressions: false, // set by default
matchWholeCell: true, // set by default
```

Related options:
- [`matchWholeCell`](/docs/api/interfaces/configparams#matchwholecell)
- [`useRegularExpressions`](/docs/api/interfaces/configparams#useregularexpressions)
- [`useWildcards`](/docs/api/interfaces/configparams#usewildcards)

### `TRUE` and `FALSE` constants

Microsoft Excel has built-in constants (keywords) for the boolean values (`TRUE` and `FALSE`).

To set up HyperFormula in the same way, define `TRUE` and `FALSE` as [named expressions](/docs/guide/named-expressions), by using HyperFormula's [`TRUE()`](/docs/guide/built-in-functions#logical) and [`FALSE()`](/docs/guide/built-in-functions#logical) functions.

```js
hfInstance.addNamedExpression('TRUE', '=TRUE()');
hfInstance.addNamedExpression('FALSE', '=FALSE()');
```

### Array arithmetic mode

In Microsoft Excel, the [array arithmetic mode](/docs/guide/arrays#array-arithmetic-mode) is enabled by default.

To set up HyperFormula in the same way, set the [`useArrayArithmetic`](/docs/api/interfaces/configparams#usearrayarithmetic) option to `true`.

```js
useArrayArithmetic: true,
```

### Whitespace in formulas

In Microsoft Excel, all whitespace characters inside formulas are ignored.

To set up HyperFormula in the same way, set the [`ignoreWhiteSpace`](/docs/api/interfaces/configparams#ignorewhitespace) option to `'any'`.

```js
ignoreWhiteSpace: 'any',
```

### Formulas that evaluate to `null`

In Microsoft Excel, formulas that evaluate to empty values are forced to evaluate to zero instead.

To set up HyperFormula in the same way, set the [`evaluateNullToZero`](/docs/api/interfaces/configparams#evaluatenulltozero) option to `true`.

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
- [`smartRounding`](/docs/api/interfaces/configparams#smartrounding)
- [`precisionEpsilon`](/docs/api/interfaces/configparams#precisionepsilon)

### Separators

In Microsoft Excel, separators depend on your configured locale, whereas in HyperFormula, you set up separators through options (e.g., [`decimalSeparator`](/docs/api/interfaces/configparams#decimalseparator)).

In Excel's  `en-US` locale, the thousands separator and the function argument separator use the same character: `,` (a comma). But in HyperFormula, [`functionArgSeparator`](/docs/api/interfaces/configparams#functionargseparator) can't be the same as [`thousandSeparator`](/docs/api/interfaces/configparams#thousandseparator). For this reason, you can't achieve full compatibility with Excel's `en-US` locale.

To match Excel's `en-US` locale as closely as possible, use the default configuration:

```js
functionArgSeparator: ',', // set by default
decimalSeparator: '.', // set by default
thousandSeparator: '', // set by default
arrayColumnSeparator: ',', // set by default
arrayRowSeparator: ';', // set by default
```

Related options:
- [`functionArgSeparator`](/docs/api/interfaces/configparams#functionargseparator)
- [`decimalSeparator`](/docs/api/interfaces/configparams#decimalseparator)
- [`thousandSeparator`](/docs/api/interfaces/configparams#thousandseparator)
- [`arrayRowSeparator`](/docs/api/interfaces/configparams#arrayrowseparator)
- [`arrayColumnSeparator`](/docs/api/interfaces/configparams#arraycolumnseparator)

### Date and time formats

In Microsoft Excel, date and time formats depend on your configured locale, whereas in HyperFormula you can [set them up freely](/docs/guide/date-and-time-handling).

Options related to date and time formats:
- [`dateFormats`](/docs/api/interfaces/configparams#dateformats)
- [`timeFormats`](/docs/api/interfaces/configparams#timeformats)
- [`nullYear`](/docs/api/interfaces/configparams#nullyear)
- [`parseDateTime()`](/docs/api/interfaces/configparams#parsedatetime)
- [`stringifyDateTime()`](/docs/api/interfaces/configparams#stringifydatetime)
- [`stringifyDuration()`](/docs/api/interfaces/configparams#stringifyduration)

## Full configuration

This configuration aligns HyperFormula with the default behavior of Microsoft Excel (set to locale `en-US`), as closely as possible at this development stage (version `3.3.0`).

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
