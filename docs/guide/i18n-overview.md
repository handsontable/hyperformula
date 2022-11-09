# Internationalization overview

Configure HyperFormula to work with your language and local conventions.

::: tip
By default HyperFormula uses European-style date formats.
:::

**Contents:**
[[toc]]

## Configuration related to internationalization

### Localization of function names and errors

HyperFormula accepts localized function names and displays errors translated to the configured language.
The library comes with [17 built-in languages and the ability to define a custom one](localizing-functions.md).

### Date and time formats

In HyperFormula, you set up date and time formats through these options:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats)
- [`timeFormats`](../api/interfaces/configparams.md#timeformats)
- [`nullYear`](../api/interfaces/configparams.md#nullyear)

If you want to use a format that cannot be configured using the options above, you can define [custom methods for parsing and stringifying date and time values](date-and-time-handling.md#custom-functions-for-handling-date-and-time):

To set up formats popular in the USA, use this configuration:

```js
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

### Number format

With these options, you can configure the characters used to separate different parts of the number:
- [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)
- [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator)

::: tip
  In HyperFormula both [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) and [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) must be different from [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator).
  In some cases it might cause compatibility issues with other spreadsheets e.g. [Microsoft Excel](compatibility-with-microsoft-excel.md#separators) or [Google Sheets](compatibility-with-google-sheets.md#separators).
:::

To use the number format popular in the USA (i.e. `1,000,000.00`), set:

```js
decimalSeparator: '.', // set by default
thousandSeparator: ',',
functionArgSeparator: ';', // might cause incompatibility with other spreadsheets
```

### Currency symbol

A currency symbol can be configured through [`currencySymbol`](../api/interfaces/configparams.md#currencysymbol) parameter.
For US dollar symbol, use:
```js
currencySymbol: ['$', 'USD'],
```

### String comparison

String comparison works according to the conventions of the language provided as [`localeLang`](../api/interfaces/configparams.md#localelang):

```js
localeLang: 'en-US',
```

If this is not sufficient, the rules of comparison can be further configured using these options:
- [`caseSensitive`](../api/interfaces/configparams.md#casesensitive)
- [`accentSensitive`](../api/interfaces/configparams.md#accentsensitive)
- [`caseFirst`](../api/interfaces/configparams.md#casefirst)
- [`ignorePunctuation`](../api/interfaces/configparams.md#ignorepunctuation)

### Compatibility with locale-dependent syntax in other spreadsheet software

The locale-dependent compatibility is described in the dedicated guides:
- [Compatibility with Microsoft Excel](compatibility-with-microsoft-excel.md)
- [Compatibility with Google Sheets](compatibility-with-google-sheets.md)

### Full configuration

This configuration aligns HyperFormula with the `en-US` locale. Due to the [configuration of separators](#number-format) it might not be fully compatible with formulas from other spreadsheet software.

```js
const options = {
  language: 'enUS',
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
  decimalSeparator: '.', // set by default
  thousandSeparator: ',',
  functionArgSeparator: ';', // might cause incompatibility with other spreadsheets
  currencySymbol: ['$', 'USD'],
  localeLang: 'en-US',
};
```

## Demo

This demo presents the configuration of HyperFormula for `en-US` locale.

<iframe
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/feature/issue-1025/i18n?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: basic-operations"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>
