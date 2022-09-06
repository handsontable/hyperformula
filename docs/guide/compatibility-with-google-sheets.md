# Compatibility with Google Sheets

Achieve nearly full compatibility wih Google Sheets, using the right HyperFormula configuration.

**Contents:**
[[toc]]

## Overview

While HyperFormula conforms to the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html) standard, it also follows industry practices set by other spreadsheets such as Microsoft Excel or Google Sheets.

That said, there are cases when HyperFormula can't be compatible with all three at the same time, because of inconsistencies (between the OpenDocument standard, Microsoft Excel and Google Sheets), limitations of HyperFormula at its current development stage (version `{{ $page.version }}`), or limitations of Microsoft Excel or Google Sheets themselves. For the full list of such differences, see [this](list-of-differences.md) page.

Still, with the right configuration, you can achieve nearly full compatibility.

## Configure compatibility with Google Sheets

### Array arithmetic mode

In Google Sheets, the [array arithmetic mode](arrays.md#array-arithmetic-mode) is disabled by default.

To set up HyperFormula in the same way, set the [`useArrayArithmetic`](../api/interfaces/configparams.md#usearrayarithmetic) option to `false`.

```js
useArrayArithmetic: false, // set by default

### Leap year bug

In Google Sheets, the year 1900 is [correctly](https://developers.google.com/sheets/api/guides/formats#about_date_and_time_values) treated as a common year, not a leap year.

To set up HyperFormula in the same way, use the default configuration:

```js
leapYear1900: false, // set by default
```

### Numerical precision

Both HyperFormula and Google Sheets automatically round floating-point numbers. To configure this feature, use these options:
- [`smartRounding`](../api/interfaces/configparams.md#smartrounding)
- [`precisionEpsilon`](../api/interfaces/configparams.md#precisionepsilon)

### Separators

In Google Sheets, separators depend on your configured locale, whereas in HyperFormula, you set up separators through options (e.g., [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)).

In Google Sheets'  `en-US` locale, the thousands separator and the function argument separator use the same character: `,` (a comma). But in HyperFormula, [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator) can't be the same as [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator). For this reason, you can't achieve full compatibility with Google Sheets' `en-US` locale.

To match Google Sheets' `en-US` locale as closely as possible, use the default configuration:

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

In Google Sheets, date and time formats depend on your configured locale, whereas in HyperFormula, you set up date and time formats through these options:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats)
- [`timeFormats`](../api/interfaces/configparams.md#timeformats)
- [`nullYear`](../api/interfaces/configparams.md#nullyear)

To set up HyperFormula in the same way as Google Sheet's `en-US` locale, use this configuration:

```js
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

You can also add custom date and time formats by using these API methods:
- [`parseDateTime()`](../api/interfaces/configparams.md#parsedatetime)
- [`stringifyDateTime()`](../api/interfaces/configparams.md#stringifydatetime)
- [`stringifyDuration()`](../api/interfaces/configparams.md#stringifyduration)

## Full configuration

This configuration aligns HyperFormula with the the default behavior of Google Sheets (set to locale `en-US`), as closely as possible at this development stage (version `{{ $page.version }}`).

```js
// define options
const options = {
  functionArgSeparator: ',', // set by default
  decimalSeparator: '.', // set by default
  thousandSeparator: '', // set by default
  arrayColumnSeparator: ',', // set by default
  arrayRowSeparator: ';', // set by default
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
  nullYear: 30, // set by default
  localeLang: 'en', // set by default
  useArrayArithmetic: true,
  leapYear1900: false, // set by default
  smartRounding: true, // set by default
};
```