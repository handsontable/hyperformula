# Types of values

Values in HyperFormula can refer to Numbers, Text, Logical, Date, Time,
DateTime, Error, or Duration data.  The type of the value depends on
the data to which it's referring. Functions may work differently based
on the types of values.

| Type of value | Description |
| :--- | :--- |
| Number | A numeric value such as 0, 2, -40, 0.1, and also scientific notation e.g. 5.6E+01; with a period as a default decimal separator. |
| Text (string) | A text value, like "ABC", "apollo". |
| Logical (Distinct Boolean) | A logical value might be one of two values: TRUE or FALSE. Please note that even if there is type coercion this will be recognized as TRUE/FALSE when comparing to numbers. It will not be recognized as 1 or 0. |
| Date | A Gregorian calendar date in DD/MM/YYYYY (default format), like 22/06/2022. All dates from 30/12/1899 to 31/12/9999 are supported. |
| Time | A time in hh:mm:ss or hh:mm (default format), like 10:40:16. |
| DateTime | Date and Time types combined into one, like 22/06/2022 10:40:16. |
| Error | An error returned as a result of formula calculation, like #REF! |
| Duration | A time-based amount of time |
| Currency | Number representing currency |
| Percentage | Number representing percentage |

## Getting cell type

Cells have types that can be retrieved by using the `getCellType`
method. Cell content is not calculated and the method returns only
the type, so, for example, you can check if there is a formula inside
a cell. Here is the list of possible cell types: `'FORMULA'`, `'VALUE'`,
`'ARRAY'`, `'EMPTY`, `ARRAYFORMULA`.

## Getting cell value type

You can also use the `getCellValueType` method which returns
the calculated value type, so a cell's value for the formula:
`'=SUM(1, 2, 3)'` will be 'NUMBER'. Here is the list of possible cell value
types: `'NUMBER'`, `'STRING'`, `'BOOLEAN'`, `'ERROR'`, `'EMPTY'`.

## Getting detailed cell value type

Currently, number type contains several subtypes (date, time, datetime, currency, percentage),
that can be used interchangeably with numbers in computation. We keep track of those, so eg if
a function produces currency-type output, and later the value is used in arithmetic operations,
the output of those is as well-marked as currency-type. Info about those can be extracted via `getCellValueDetailedType` function.
Auxiliary information about formatting (if there is any) is available via `getCellValueFormat` function. In case of currency, it would be
the currency symbol used when parsing the currency (e.g. '$').
