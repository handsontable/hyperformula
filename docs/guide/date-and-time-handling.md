# Date and time handling

The formats for the default date and time parsing functions can be set using configuration options:
- [`dateFormats`](../api/interfaces/configparams.md#dateformats),
- [`timeFormats`](../api/interfaces/configparams.md#timeformats),
- [`nullYear`](../api/interfaces/configparams.md#nullyear).

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

HyperFormula offers the possibility to extend the number of supported
date/time formats as well as the behavior of this functionality by exposing
three options:

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

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/date-time/example1.html)

@[code](@/docs/examples/date-time/example1.css)

@[code](@/docs/examples/date-time/example1.js)

@[code](@/docs/examples/date-time/example1.ts)

:::
