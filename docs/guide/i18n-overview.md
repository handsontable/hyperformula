# Internationalization overview

Configure HyperFormula to work with your language and local conventions.

**Contents:**
[[toc]]

## Configuration related to internationalization

### Localization of function names and errors

HyperFormula accepts localized function names and displays errors translated to the configured language.
The library comes with [17 built-in languages and the ability to define a custom one](localizing-functions.md).

### Date and time formats

By default, HyperFormula uses European date and time formats, but it can be [configured to follow any regional convention](date-and-time-handling.md).

### Number format

With these options, you can configure the characters used to separate different parts of the number:
- [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)
- [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator)

::: tip
  In HyperFormula both [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) and [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) must be different from [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator).
  In some cases it might cause compatibility issues with other spreadsheets e.g. [Microsoft Excel](compatibility-with-microsoft-excel.md#separators) or [Google Sheets](compatibility-with-google-sheets.md#separators).
:::

The following number format configuration is used by default (e.g. `1000000.00`):

```js
decimalSeparator: '.', // set by default
thousandSeparator: '', // set by default
functionArgSeparator: ',', // set by default
```

To use the number format popular in the USA (i.e. `1,000,000.00`), set:

```js
decimalSeparator: '.', // set by default
thousandSeparator: ',',
functionArgSeparator: ';', // might cause incompatibility with other spreadsheets
```

### Currency symbol

A currency symbol can be configured through [`currencySymbol`](../api/interfaces/configparams.md#currencysymbol) parameter.

The following currency symbol is used by default:

```js
currencySymbol: ['$'], // set by default
```

You can customize the symbol or provide multiple symbols to be recognized, e.g. for all symbols used in the USA:
```js
currencySymbol: ['$', 'USD'],
```

### String comparison

String comparison works according to the conventions of the language provided as [`localeLang`](../api/interfaces/configparams.md#localelang):

```js
localeLang: 'en-US',
```

The provided `localeLang` value is processed by the JavaScript standard library [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator) object.

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
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.2.x/i18n?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: basic-operations"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>
