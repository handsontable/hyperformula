# Date and time handling

The formats for the default date and time parsing functions can be set using configuration options:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats),
- [`timeFormats`](../api/interfaces/configparams.md#timeformats),
- [`nullYear`](../api/interfaces/configparams.md#nullyear).

The API reference of [`dateFormats`](../api/interfaces/configparams.md#dateformats) and [`timeFormats`](../api/interfaces/configparams.md#timeformats) describes the supported date and time formats in detail.

## Example

By default, HyperFormula uses the European date and time formats.

```javascript
dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'], // set by default
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

To use the US date and time formats, set:

```javascript
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'], // US date formats
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

## Custom date and time handling

If date and time formats supported by the [`dateFormats`](../api/interfaces/configparams.md#dateformats) and [`timeFormats`](../api/interfaces/configparams.md#timeformats) parameters are not enough, you can extend them by providing the following options:

- [`parseDateTime`](../api/interfaces/configparams.md#parsedatetime), which allows to provide a function that accepts
a string representing date/time and parses it into an actual date/time format
- [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime), which allows to provide a function that
takes the date/time and prints it as a string
- [`stringifyDuration`](../api/interfaces/configparams.md#stringifyduration), which allows to provide a function that
takes time duration and prints it as a string

To extend the number of possible date formats, you will need to
configure [`parseDateTime`](../api/interfaces/configparams.md#parsedatetime) . This functionality is based on callbacks,
and you can customize the formats by integrating a third-party
library like [Moment.js](https://momentjs.com/), or by writing your
own custom function that returns a [`DateTime`](../api/globals.md#datetime) object.

The configuration of date formats and stringify options may impact some built-in functions.
For instance, the `VALUE` function transforms strings
into numbers, which means it uses [`parseDateTime`](../api/interfaces/configparams.md#parsedatetime). The `TEXT` function
works the other way round - it accepts a number and returns a string,
so it uses `stringifyDateTime`. Any change here might give you
different results. Criteria-based functions (`SUMIF`, `AVERAGEIF`, etc.) perform comparisons, so they also need to
work on strings, dates, etc.

## Moment.js integration

In this example, you will add the possibility to parse dates in the
`"Do MMM YY"` custom format.

To do so, you first need to write a function using
[Moment.js API](https://momentjs.com/docs/):

```javascript
import moment from "moment";

// write a custom function for parsing dates
export const customParseDate = (dateString, dateFormat) => {
  const momentDate = moment(dateString, dateFormat, true);
  // check validity of a date with moment.js method
  if (momentDate.isValid()) {
    return {
      year: momentDate.year(),
      month: momentDate.month() + 1,
      day: momentDate.date()
    };
  }
  // if the string was not recognized as
  // a valid date return nothing
  return undefined;
};
```

Then, use it inside the
[configuration options](configuration-options.md) like so:

```javascript
const options = {
    parseDateTime: customParseDate,
    // you can add more formats
    dateFormats: ["Do MMM YY"]
};
```

After that, you should be able to add a dataset with dates in
your custom format:

```javascript
const data = [["31st Jan 00", "2nd Jun 01", "=B1-A1"]];
```

And now, HyperFormula recognizes these values as valid dates and can operate on them.

## Currency integration

By default, the `TEXT` function recognizes a limited set of currency-looking formats such as `"$#,##0.00"` via the built-in number formatter. When you need richer, locale-aware currency output — for example `"[$€-2] #,##0.00"` (EUR with German grouping) or `"[$zł-415] #,##0.00"` (PLN, locale `pl-PL`) — provide a [`stringifyCurrency`](../api/interfaces/configparams.md#stringifycurrency) callback.

HyperFormula itself ships with **no currency data** and **no currency library dependency**. You choose how to format: native `Intl.NumberFormat`, a third-party library, or a hand-rolled lookup table. The callback receives the raw number and the Excel format string and returns either a formatted string or `undefined` (to fall through to the built-in formatter).

### Example: `Intl.NumberFormat` adapter (zero dependencies)

This example maps a small but representative subset of Excel currency format strings onto the native [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) API.

```javascript
// Minimal Excel-format-string → Intl.NumberFormat adapter.
// Extend the LCID_TO_LOCALE map and CURRENCY_RULES list to cover more formats.

const LCID_TO_LOCALE = {
  '-409': { locale: 'en-US', currency: 'USD' },  // USD
  '-2':   { locale: 'de-DE', currency: 'EUR' },  // EUR (generic)
  '-411': { locale: 'ja-JP', currency: 'JPY' },  // JPY
  '-415': { locale: 'pl-PL', currency: 'PLN' },  // PLN
  '-809': { locale: 'en-GB', currency: 'GBP' },  // GBP
}

const CURRENCY_RULES = [
  // [$SYMBOL-LCID] #,##0[.00] — Excel's locale-tagged currency
  {
    pattern: /^\[\$([^\-\]]*)-([0-9A-Fa-f]+)\]\s*#,##0(\.0+)?$/,
    build: (match) => {
      const lcid = '-' + match[2]
      const fractionDigits = (match[3] || '.').length - 1
      const entry = LCID_TO_LOCALE[lcid] || { locale: 'en-US', currency: 'USD' }
      return new Intl.NumberFormat(entry.locale, {
        style: 'currency',
        currency: entry.currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    },
  },
  // $#,##0.00 — USD shorthand
  {
    pattern: /^\$#,##0(\.0+)?$/,
    build: (match) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: (match[1] || '.').length - 1,
      maximumFractionDigits: (match[1] || '.').length - 1,
    }),
  },
  // #,##0.00 "SYM" — trailing quoted symbol (e.g. zł, €)
  {
    pattern: /^#,##0(\.0+)?\s+"([^"]+)"$/,
    build: (match) => {
      const fractionDigits = (match[1] || '.').length - 1
      const symbol = match[2]
      const localeBySymbol = { 'zł': 'pl-PL', '€': 'de-DE', '£': 'en-GB', '¥': 'ja-JP' }
      const locale = localeBySymbol[symbol] || 'en-US'
      const nf = new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
      return { format: (value) => `${nf.format(value)} ${symbol}` }
    },
  },
]

// Accounting: $#,##0.00;($#,##0.00) — positive;negative with parentheses
function tryAccountingFormat(value, format) {
  const sections = format.split(';')
  if (sections.length !== 2) return undefined
  const isNegative = value < 0
  const section = sections[isNegative ? 1 : 0]
  const parenMatch = /^\(\$#,##0(\.0+)?\)$/.exec(section)
  const plainMatch = /^\$#,##0(\.0+)?$/.exec(section)
  if (!parenMatch && !plainMatch) return undefined
  const fractionDigits = ((parenMatch || plainMatch)[1] || '.').length - 1
  const nf = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  const formatted = nf.format(Math.abs(value))
  return isNegative && parenMatch ? `(${formatted})` : formatted
}

export const customStringifyCurrency = (value, currencyFormat) => {
  const accounting = tryAccountingFormat(value, currencyFormat)
  if (accounting !== undefined) return accounting

  for (const rule of CURRENCY_RULES) {
    const match = rule.pattern.exec(currencyFormat)
    if (match) return rule.build(match).format(value)
  }
  // Not a recognized currency format — let HyperFormula fall through
  // to the built-in number formatter.
  return undefined
}
```

Then plug it into your [configuration options](configuration-options.md):

```javascript
const options = {
    stringifyCurrency: customStringifyCurrency,
}

const hf = HyperFormula.buildFromArray([
  [1234.5, '=TEXT(A1, "[$€-2] #,##0.00")'],
  [12345.5, '=TEXT(A2, "[$zł-415] #,##0.00")'],
  [-1234.5, '=TEXT(A3, "$#,##0.00;($#,##0.00)")'],
], options)

console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })) // "1.234,50 €"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 1 })) // "12 345,50 zł"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 2 })) // "($1,234.50)"
```

### When to swap in a library

The adapter above covers six common Excel format shapes in under one page of code. If you need:

- Arbitrary Excel-style format strings beyond this subset,
- Precision-safe arithmetic on currency values (e.g. cents as integers),
- ISO 4217 currency metadata for dozens of currencies,

consider wrapping [`Dinero.js` v2](https://v2.dinerojs.com/) or your own format library inside the callback. The contract is the same: `(value: number, currencyFormat: string) => string | undefined`. Return `undefined` for any format string you don't want to handle and HyperFormula will fall back to its built-in number formatter.

### Related configuration

- [`currencySymbol`](../api/interfaces/configparams.md#currencysymbol) — governs how HyperFormula **parses** currency literals in input (e.g. `"$100"` → `100`). It is **independent** of `stringifyCurrency`, which governs TEXT output.
- [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) / [`stringifyDuration`](../api/interfaces/configparams.md#stringifyduration) — sister callbacks for date and duration formatting.

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/date-time/example1.html)

@[code](@/docs/examples/date-time/example1.css)

@[code](@/docs/examples/date-time/example1.js)

@[code](@/docs/examples/date-time/example1.ts)

:::
