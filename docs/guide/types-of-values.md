# Types of values

In HyperFormula, values can be of type Number, Text, Logical, Date, Time, DateTime, Error, Currency, or Percentage depending on the data.
Functions may work differently based on the types of arguments.

| Type of value              | Description                                                                                                                                                                                                      |
|:---------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Number                     | A numeric value such as 0, 2, -40, 0.1, and also scientific notation e.g. 5.6E+01; with a period as a default decimal separator.                                                                                 |
| Text (string)              | A text value, like "ABC", "apollo". Inside a formula, it should be enclosed in double quotes (`"`).                                                                                                                                                                             |
| Logical (Distinct Boolean) | A logical value might be one of two values: TRUE or FALSE. Please note that even if there is type coercion this will be recognized as TRUE/FALSE when comparing to numbers. It will not be recognized as 1 or 0. |
| Date                       | A Gregorian calendar date in DD/MM/YYYY (default format), like 22/06/2022. All dates from 30/12/1899 to 31/12/9999 are supported.                                                                                |
| Time                       | A time in hh:mm:ss or hh:mm (default format), like 10:40:16.                                                                                                                                                     |
| DateTime                   | Date and Time types combined into one, like 22/06/2022 10:40:16.                                                                                                                                                 |
| Error                      | An error returned as a result of formula calculation, like #REF!                                                                                                                                                 |
| Currency                   | Number representing currency                                                                                                                                                                                     |
| Percentage                 | Number representing percentage                                                                                                                                                                                   |

## How cell value types are determined

HyperFormula automatically detects the type of cell content when you set a value using methods like `setCellContents`, `buildFromArray`, or `setSheetContent`. The type detection follows this priority order:

### For JavaScript values

When you pass JavaScript values directly (not as strings):

- `number` → **Number type**
- `boolean` → **Logical type**
- `Date` object → **Date/DateTime type** (converted to internal numeric representation)
- `null` or `undefined` → **Empty cell**

```js
const hf = HyperFormula.buildFromArray([
  [42],            // Number
  [true],          // Logical
  [new Date()],    // Date/DateTime
  [null],          // Empty
]);
```

### For string values

When you pass string values, HyperFormula detects the type as follows:

- String is "TRUE" or "FALSE" (case-insensitive) → **Logical type**
- String starting with `=` → **Formula type**
- String ending with `%` → **Percentage type**
- String contains currency symbol → **Currency type**
- String can be parsed as a number → **Number type**
- String matches date/time format → **Date/Time/DateTime type**
- None of the above match → **Text type**

```js
const hf = HyperFormula.buildFromArray([
  ["TRUE"],                 // Logical
  ["true"],                 // Logical
  ["=SUM(1,2,3)"],          // Formula
  ["25%"],                  // Percentage (0.25)
  ["$100"],                 // Currency (100)
  ["123.45"],               // Number
  ["5E+01"],                // Number
  ["22/06/2022 10:40:16"],  // DateTime
  ["22/06/2022"],           // Date
  ["10:40:16"],             // Time
  ["Hello"],                // Text
]);
```

### Forcing the text value type

Sometimes a value should be treated as text even though it's parsable as a formula, number, date, time, datetime, boolean, currency or percentage.
Typical examples are numeric values with no number semantics, such as ZIP codes, bank sort codes, social security numbers, etc.

To prevent the automatic type conversion, prepend the value value with an apostrophe (`'`).

```js
const hf = HyperFormula.buildFromArray([
    ["11201"], // a number: 11201
    ["'11201"], // a string: "11201"
    ["22/06/2022"], // a date: June 22nd 2022
    ["'22/06/2022"], // a string: "22/06/2022"
]);

// a formula: SUM(B1,B2)
hf.setCellContents({ col: 0, row: 4, sheet: 0 }, [["=SUM(B1,B2)"]]);

// a string: "=SUM(B1,B2)"
hf.setCellContents({ col: 0, row: 5, sheet: 0 }, [["'=SUM(B1,B2)"]]);
```

## Date and time values

For better compatibility with other spreadsheet software, HyperFormula stores
date and time values as numbers. This makes it easier to perform mathematical
operations such as calculating the number of days between two dates.

- A Date value is represented as the number of full days since
  [`nullDate`](../api/interfaces/configparams.md#nulldate).
- A Time value is represented as a fraction of a full day.
- A DateTime value is represented as the number of (possibly fractional) days
  since [`nullDate`](../api/interfaces/configparams.md#nulldate).

## Text values

When working with text values directly inside formulas, you must enclose them in double quotes (`"`). This is different from entering text into cells, where quotes are not required. E.g.:

```excel
=IF(B1="Active", "Status OK", "Check Status")
```

## Getting cell type

Cells have types that can be retrieved by using the `getCellType` method. Cell
content is not calculated and the method returns only the type, so, for example,
you can check if there is a formula inside a cell. Here is the list of possible
cell types: `'FORMULA'`, `'VALUE'`, `'ARRAY'`, `'EMPTY`, `ARRAYFORMULA`.

## Getting cell value type

You can also use the `getCellValueType` method which returns the calculated
value type, so a cell's value for the formula: `'=SUM(1, 2, 3)'` will be
'NUMBER'. Here is the list of possible cell value types: `'NUMBER'`, `'STRING'`,
`'BOOLEAN'`, `'ERROR'`, `'EMPTY'`.

## Getting detailed cell value type

Currently, number type contains several subtypes (date, time, datetime,
currency, percentage), that can be used interchangeably with numbers in
computation. We keep track of those, so e.g. if a function produces
currency-type output, and later the value is used in arithmetic operations, the
output of those is as well-marked as currency-type. Info about those can be
extracted via `getCellValueDetailedType` function. Auxiliary information about
formatting (if there is any) is available via `getCellValueFormat` function. In
case of currency, it would be the currency symbol used when parsing the currency
(e.g. '$').
