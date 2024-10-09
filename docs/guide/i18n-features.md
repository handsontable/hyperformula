# Internationalization features

Configure HyperFormula to match the languages and regions of your users.

**Contents:**
[[toc]]

## Function names and errors

Each of HyperFormula's [built-in functions](built-in-functions.md) and [errors](types-of-errors.md) is available in [17 languages](localizing-functions.md#list-of-supported-languages).

You can easily [switch between languages](localizing-functions.md) ([`language`](../api/interfaces/configparams.md#language)).

When adding a [custom function](custom-functions.md), you can define the function's [name](custom-functions.md#_3-add-your-function-s-names) in every language that you support.

To support more languages, add a [custom language pack](localizing-functions.md).

## Date and time formats

To match a region's calendar conventions, you can set multiple date formats ([`dateFormats`](../api/interfaces/configparams.md#dateformats)) and time formats ([`timeFormats`](../api/interfaces/configparams.md#timeformats)).

By default, HyperFormula uses the European date and time formats. [You can easily change them](date-and-time-handling.md#example).

You can also add custom ways of [handling dates and times](date-and-time-handling.md#custom-date-and-time-handling).

## Number format

To match a region's number format, configure HyperFormula's decimal separator ([`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator)) and thousands separator ([`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator)).

By default, HyperFormula uses the European number format (`1000000.00`):

```js
decimalSeparator: '.', // set by default
thousandSeparator: '', // set by default
```

To use the US number format (`1,000,000.00`), set:

```js
decimalSeparator: '.', // set by default
thousandSeparator: ',',
```

::: tip
  In HyperFormula, both [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) and [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) must be different from [`functionArgSeparator`](../api/interfaces/configparams.md#functionargseparator).
  In some cases it might cause compatibility issues with other spreadsheets, e.g., [Microsoft Excel](compatibility-with-microsoft-excel.md#separators) or [Google Sheets](compatibility-with-google-sheets.md#separators).
:::

## Currency symbol

To match your users' currency, you can configure multiple currency symbols ([`currencySymbol`](../api/interfaces/configparams.md#currencysymbol)).

The default currency symbol is `$`. To add `USD` as an alternative, set:

```js
currencySymbol: ['$', 'USD'],
```

## String comparison rules

To make sure that language-sensitive strings are compared in line with your users' language (e.g., `Préservation` vs. `Preservation`), set HyperFormula's [string comparison rules](types-of-operators.md#comparing-strings) ([`localeLang`](../api/interfaces/configparams.md#localelang)).

The value of [`localeLang`](../api/interfaces/configparams.md#localelang) is processed by [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator), a JavaScript standard object.

The default setting is:

```js
localeLang: 'en', // set by default
```

To set the `en-US` string comparison rules, set:

```js
localeLang: 'en-US',
```

To further customize string comparison rules, use these options:
- [`caseSensitive`](../api/interfaces/configparams.md#casesensitive)
- [`accentSensitive`](../api/interfaces/configparams.md#accentsensitive)
- [`caseFirst`](../api/interfaces/configparams.md#casefirst)
- [`ignorePunctuation`](../api/interfaces/configparams.md#ignorepunctuation)

## Compatibility with other spreadsheet software

For information on compatibility with locale-dependent syntax in other spreadsheet software, see:
- [Compatibility with Microsoft Excel](compatibility-with-microsoft-excel.md)
- [Compatibility with Google Sheets](compatibility-with-google-sheets.md)

## `en-US` configuration

This configuration aligns HyperFormula with the `en-US` locale. Due to the configuration of [separators](#number-format), it might not be fully compatible with formulas coming from other spreadsheet software.

```js
language: 'enUS',
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
decimalSeparator: '.', // set by default
thousandSeparator: ',',
functionArgSeparator: ';', // might cause incompatibility with other spreadsheets
currencySymbol: ['$', 'USD'],
localeLang: 'en-US',
```

## `en-US` demo

This demo shows HyperFormula configured for the `en-US` locale.

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/i18n/example1.html)

@[code](@/docs/examples/i18n/example1.css)

@[code](@/docs/examples/i18n/example1.js)

@[code](@/docs/examples/i18n/example1.ts)

:::
