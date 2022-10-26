# Internationalization overview

Configure HyperFormula to work with your language and local conventions.

::: tip
By default HyperFormula uses en-GB locale (British English). but with `$` as a currency symbol ???
:::

**Contents:**
[[toc]]

## Overview

Internationalization support in HyperFormula includes:
- localization of function names and errors;
- different formats of:
  - date,
  - time,
  - numbers;
- custom currency symbols;
- string comparison conventions (including accents);
- compatibility with locale-dependent syntax differences in other spreadsheet software.

### Localization of function names and errors

HyperFormula accepts localized function names and displays errors translated to the [configured language](localizing-functions.md).
The library comes with 17 built-in languages and the ability to define a custom one.

### Date and time formats

In HyperFormula, you set up date and time formats through these options:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats)
- [`timeFormats`](../api/interfaces/configparams.md#timeformats)
- [`nullYear`](../api/interfaces/configparams.md#nullyear)

If you want to use a format that cannot be configured using the options above, you can define custom methods for parsing and stringifying date and time values:
- [`parseDateTime()`](../api/interfaces/configparams.md#parsedatetime)
- [`stringifyDateTime()`](../api/interfaces/configparams.md#stringifydatetime)
- [`stringifyDuration()`](../api/interfaces/configparams.md#stringifyduration)

// TODO: link to date-and-time guide

### Number format

The number format can be set up through these options:
- [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)
- [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator)

::: tip
  In HyperFromula both [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) and [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) must be different from [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator).
  In some cases it might cause compatibility issues with other spreadsheets e.g. [Microsoft Excel](compatibility-with-microsoft-excel.md#separators) or [Google Sheets](compatibility-with-google-sheets.md#separators).
:::

### Currency symbol

A currency symbol can be configured through [`currencySymbol`](../api/interfaces/configparams.md#currencySymbol) parameter.

### String comparison

Configuration parameters related to the string comparison rules:
- [`caseSensitive`](../api/interfaces/configparams.md#casesensitive)
- [`accentSensitive`](../api/interfaces/configparams.md#accentsensitive)
- [`caseFirst`](../api/interfaces/configparams.md#casefirst)
- [`ignorePunctuation`](../api/interfaces/configparams.md#ignorepunctuation)
- [`localeLang`](../api/interfaces/configparams.md#localelang)

### Compatibility with locale-dependent syntax in other spreadsheet software

The locale-dependent compatibility is described in the dedicated guides:
- [Compatibility with Microsoft Excel](compatibility-with-microsoft-excel.md)
- [Compatibility with Google Sheets](compatibility-with-google-sheets.md)

## Full configuration

This configuration aligns HyperFormula with the `en-US` locale. Due to the [configuration of separators](#number-format) it's not fully compatible with formulas from other spreadsheet software.

```js
const options = {
    
};
```

- language
- functionArgSeparator, decimalSeparator, thousandSeparator
- accentSensitive, localeLang (in the context of string comparison)
- dateFormats, timeFormats, parseDateTime, stringifyDateTime, stringifyDuration (date/time format), link to guide about date/time formats
- currencySymbol

- `language: 'enUS'` (add this language and make sure there are no differences in function names between 'enGB' and 'enUS')
- `dateFormats: ['MM/DD/YYYY', 'MM/DD/YY']`
- make sure `timeFormats: ['hh:mm', 'hh:mm:ss.sss']` accepts AM/PM notation, add this information to the API reference
- `decimalSeparator` cannot be set to `,` because it must be different from `functionArgSeparator`
- `localeLang: 'en-US'` (make sure it works)

Full config for Excel (enUS) -> link to compatibility

## Demo

This demo presents the configuration of HyperFormula for en-US locale.

// TODO correct link
<iframe
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.1.x/basic-operations?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: basic-operations"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
