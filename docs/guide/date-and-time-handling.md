---
tags:
  - dates
  - dateFormats
  - timeFormats
  - parseDateTime
  - stringifyDateTime
  - stringifyDuration
  - nullYear
  - date parsing
---

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

## Dates in function arguments and `#VALUE!` errors

Functions that expect a date, such as `XIRR`, `YEARFRAC`, `DATEDIF`, and `DATEVALUE`, need real date values. HyperFormula returns `#VALUE!` when you pass them text that only looks like a date, such as the ISO 8601 string `2026-01-01`.

### Use real date values

Use one of the following options:

1. Build each date with the `DATE` function, for example `'=DATE(2026, 1, 1)'`.
2. Write each date in a format listed in [`dateFormats`](../api/interfaces/configparams.md#dateformats), for example `'01/01/2026'` with the default settings.
3. Add the format you use to [`dateFormats`](../api/interfaces/configparams.md#dateformats). Setting this option replaces the default list, so keep the default formats if you still need them.

This example uses option 3. HyperFormula's `XIRR` function returns about `0.7222`:

```javascript
import { HyperFormula } from 'hyperformula';

const hfInstance = HyperFormula.buildFromArray([
  [-10000, '2026-01-01'],
  [2750, '2026-03-01'],
  [4250, '2026-06-01'],
  [3250, '2026-09-01'],
  [3000, '2026-12-01'],
  ['=XIRR(A1:A5, B1:B5)'],
], {
  licenseKey: 'gpl-v3',
  dateFormats: ['DD/MM/YYYY', 'DD/MM/YY', 'YYYY-MM-DD'],
});

// about 0.7222
const result = hfInstance.getCellValue({ sheet: 0, row: 5, col: 0 });
```

### Why ISO date strings return `#VALUE!`

HyperFormula treats a string as a date only if it matches one of the [`dateFormats`](../api/interfaces/configparams.md#dateformats). With the default settings, those are `DD/MM/YYYY` and `DD/MM/YY`. A string with a different layout, such as an ISO 8601 date (year first), stays plain text. Functions that expect a date can't use that text, so they return `#VALUE!` instead of a result.

In this example, the dates in column B are ISO strings and the `dateFormats` option is not set, so HyperFormula's `XIRR` function returns `#VALUE!`:

```javascript
import { HyperFormula } from 'hyperformula';

const hfInstance = HyperFormula.buildFromArray([
  [-10000, '2026-01-01'],
  [2750, '2026-03-01'],
  [4250, '2026-06-01'],
  [3250, '2026-09-01'],
  [3000, '2026-12-01'],
  ['=XIRR(A1:A5, B1:B5)'],
], { licenseKey: 'gpl-v3' });

// #VALUE!, because B1:B5 contains text, not dates
const result = hfInstance.getCellValue({ sheet: 0, row: 5, col: 0 });
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

For currency formatting in the `TEXT` function (locale-aware grouping, non-`$` symbols, accounting patterns), see the [Currency handling](currency-handling.md) guide.

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/date-time/example1.html)

@[code](@/docs/examples/date-time/example1.css)

@[code](@/docs/examples/date-time/example1.js)

@[code](@/docs/examples/date-time/example1.ts)

:::
