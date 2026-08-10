# ConfigParams

## License

### licenseKey 

• **licenseKey**: *string*

*Defined in [src/ConfigParams.ts:182](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L182)*

Sets your HyperFormula license key.

To use HyperFormula on the GPLv3 license terms, set this option to `gpl-v3`.

To use HyperFormula with your proprietary license, set this option to your valid license key string.

For more information, go [here](/docs/guide/license-key.md).

**`default`** undefined

___

## Engine

### chooseAddressMappingPolicy 

• **chooseAddressMappingPolicy**: *ChooseAddressMapping*

*Defined in [src/ConfigParams.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L55)*

Sets the address mapping policy to be used.

Built-in implementations:
- `DenseSparseChooseBasedOnThreshold`: sets the address mapping policy separately for each sheet, based on fill ratio.
- `AlwaysDense`: uses `DenseStrategy` for all sheets.
- `AlwaysSparse`: uses `SparseStrategy` for all sheets.

For more information, see the [Performance guide](/docs/guide/performance.md).

**`default`** AlwaysDense

___

### context 

• **context**: *unknown*

*Defined in [src/ConfigParams.ts:63](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L63)*

A generic parameter that can be used to pass data to custom functions.

For more information, see the [Custom functions guide](/docs/guide/custom-functions.md).

**`default`** undefined

___

### evaluateNullToZero 

• **evaluateNullToZero**: *boolean*

*Defined in [src/ConfigParams.ts:125](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L125)*

When set to `true`, formulas evaluating to `null` evaluate to `0` instead.

**`default`** false

___

### maxColumns 

• **maxColumns**: *number*

*Defined in [src/ConfigParams.ts:228](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L228)*

Sets the maximum number of columns.

**`default`** 18.278 (Columns A, B, ..., ZZZ)

___

### maxPendingLazyTransformations 

• **maxPendingLazyTransformations**: *number*

*Defined in [src/ConfigParams.ts:435](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L435)*

Controls memory usage for long-running instances by limiting the number of
pending lazy transformations before cleanup occurs.

Structural operations (adding/removing rows/columns, moving cells) create
transformations that are applied lazily to formulas. This setting determines
how many can accumulate before they are flushed and memory is reclaimed.

Lower values reduce peak memory usage but may slightly increase CPU overhead.
Higher values reduce overhead but allow more memory accumulation.

**`default`** 50

___

### maxRows 

• **maxRows**: *number*

*Defined in [src/ConfigParams.ts:222](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L222)*

Sets the maximum number of rows.

**`default`** 40.000

___

### useArrayArithmetic 

• **useArrayArithmetic**: *boolean*

*Defined in [src/ConfigParams.ts:392](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L392)*

When set to `true`, array arithmetic is enabled globally.

When set to `false`, array arithmetic is enabled only inside array functions (`ARRAYFORMULA`, `FILTER`, and `ARRAY_CONSTRAIN`).

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** false

___

### useColumnIndex 

• **useColumnIndex**: *boolean*

*Defined in [src/ConfigParams.ts:404](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L404)*

When set to `true`, switches column search strategy from binary search to column index.

Using column index improves efficiency of the `VLOOKUP` and `MATCH` functions, but increases memory usage.

When searching with wildcards or regular expressions, column search strategy falls back to binary search (even with `useColumnIndex` set to `true`).

For more information, see the [Performance guide](/docs/guide/performance.md).

**`default`** false

___

### useStats 

• **useStats**: *boolean*

*Defined in [src/ConfigParams.ts:412](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L412)*

When set to `true`, enables gathering engine statistics and timings.

Useful for testing and benchmarking.

**`default`** false

___

## Formula Syntax

### arrayColumnSeparator 

• **arrayColumnSeparator**: *"," | ";"*

*Defined in [src/ConfigParams.ts:208](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L208)*

Sets a column separator symbol for array notation.

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** ','

___

### arrayRowSeparator 

• **arrayRowSeparator**: *";" | "|"*

*Defined in [src/ConfigParams.ts:216](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L216)*

Sets a row separator symbol for array notation.

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** ';'

___

### functionArgSeparator 

• **functionArgSeparator**: *string*

*Defined in [src/ConfigParams.ts:105](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L105)*

Sets a separator character that separates procedure arguments in formulas.

Must be different from [decimalSeparator](/docs/api/interfaces/configparams.md#decimalseparator) and [thousandSeparator](/docs/api/interfaces/configparams.md#thousandseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ','

___

### functionPlugins 

• **functionPlugins**: *any[]*

*Defined in [src/ConfigParams.ts:134](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L134)*

Lists additional function plugins to be used by the formula interpreter.

For more information, see the [Custom functions guide](/docs/guide/custom-functions.md).

**`default`** []

___

### ignoreWhiteSpace 

• **ignoreWhiteSpace**: *"standard" | "any"*

*Defined in [src/ConfigParams.ts:160](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L160)*

Controls the set of whitespace characters that are allowed inside a formula.

When set to `'standard'`, allows only SPACE (U+0020), CHARACTER TABULATION (U+0009), LINE FEED (U+000A), and CARRIAGE RETURN (U+000D) (compliant with OpenFormula Standard 1.3)

When set to `'any'`, allows all whitespace characters that would be captured by the `\s` character class of the JavaScript regular expressions.

**`default`** 'standard'

___

### language 

• **language**: *string*

*Defined in [src/ConfigParams.ts:150](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L150)*

Sets a translation package for function and error names.

For more information, see the [Localizing functions guide](/docs/guide/localizing-functions.md).

**`default`** 'enGB'

___

## Undo and Redo

### undoLimit 

• **undoLimit**: *number*

*Defined in [src/ConfigParams.ts:420](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L420)*

Sets the number of elements kept in the undo history.

For more information, see the [Undo-Redo guide](/docs/guide/undo-redo.md).

**`default`** 20

___

## Date and Time

### dateFormats 

• **dateFormats**: *string[]*

*Defined in [src/ConfigParams.ts:95](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L95)*

Sets the date formats accepted by the date-parsing function.

A format must be specified as a string consisting of tokens and separators.

Supported tokens:
- `DD` (day of month)
- `MM` (month as a number)
- `YYYY` (year as a 4-digit number)
- `YY` (year as a 2-digit number)

Supported separators:
- `/` (slash)
- `-` (dash)
- `.` (dot)
- ` ` (empty space)

Regardless of the separator specified in the format string, all of the above are accepted by the date-parsing function.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** ['DD/MM/YYYY', 'DD/MM/YY']

___

### leapYear1900 

• **leapYear1900**: *boolean*

*Defined in [src/ConfigParams.ts:170](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L170)*

Sets year 1900 as a leap year.

For compatibility with Lotus 1-2-3 and Microsoft Excel, set this option to `true`.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md) and [nullDate](/docs/api/interfaces/configparams.md#nulldate).

**`default`** false

___

### nullDate 

• **nullDate**: *[SimpleDate](simpledate.md)*

*Defined in [src/ConfigParams.ts:238](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L238)*

Internally, each date is represented as a number of days that passed since `nullDate`.

This option sets a specific date from which that number of days is counted.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** {year: 1899, month: 12, day: 30}

___

### nullYear 

• **nullYear**: *number*

*Defined in [src/ConfigParams.ts:252](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L252)*

Sets the interpretation of two-digit year values.

Two-digit year values (`xx`) can either become `19xx` or `20xx`.

If `xx` is less or equal to `nullYear`, two-digit year values become `20xx`.

If `xx` is more than `nullYear`, two-digit year values become `19xx`.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** 30

___

### parseDateTime 

• **parseDateTime**: *function*

*Defined in [src/ConfigParams.ts:262](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L262)*

Sets a function that parses strings representing date-time into actual date-time values.

The function should return a [DateTime](../globals.md#datetime) object or undefined.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** defaultParseToDateTime

#### Type declaration:

▸ (`dateTimeString`: string, `dateFormat?`: undefined | string, `timeFormat?`: undefined | string): *[Maybe](../globals.md#maybe)‹[DateTime](../globals.md#datetime)›*

**Parameters:**

Name | Type |
------ | ------ |
`dateTimeString` | string |
`dateFormat?` | undefined &#124; string |
`timeFormat?` | undefined &#124; string |

___

### stringifyDateTime 

• **stringifyDateTime**: *function*

*Defined in [src/ConfigParams.ts:302](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L302)*

Sets a function that converts date-time values into strings.

The function should return a string or undefined.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** defaultStringifyDateTime

#### Type declaration:

▸ (`dateTime`: [SimpleDateTime](../globals.md#simpledatetime), `dateTimeFormat`: string): *[Maybe](../globals.md#maybe)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`dateTime` | [SimpleDateTime](../globals.md#simpledatetime) |
`dateTimeFormat` | string |

___

### stringifyDuration 

• **stringifyDuration**: *function*

*Defined in [src/ConfigParams.ts:312](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L312)*

Sets a function that converts time duration values into strings.

The function should return a string or undefined.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** defaultStringifyDuration

#### Type declaration:

▸ (`time`: [SimpleTime](simpletime.md), `timeFormat`: string): *[Maybe](../globals.md#maybe)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`time` | [SimpleTime](simpletime.md) |
`timeFormat` | string |

___

### timeFormats 

• **timeFormats**: *string[]*

*Defined in [src/ConfigParams.ts:382](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L382)*

Sets the time formats accepted by the time-parsing function.

A format must be specified as a string consisting of at least two tokens separated by `:` (a colon).

Supported tokens:
- `hh` (hours)
- `mm` (minutes)
- `ss`, `ss.s`, `ss.ss`, `ss.sss`, `ss.ssss`, etc. (seconds)

The number of decimal places in the seconds token does not matter. All versions of the seconds token are equivalent in the context of parsing time values.
Regardless of the time format specified, the hours-minutes-seconds value may be followed by the AM/PM designator.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`example`** 
E.g., for `timeFormats = ['hh:mm:ss.sss']`, valid time strings include:
- `1:33:33`
- `1:33:33.3`
- `1:33:33.33`
- `1:33:33.333`
- `01:33:33`
- `1:33:33 AM`
- `1:33:33 PM`
- `1:33:33 am`
- `1:33:33 pm`
- `1:33:33AM`
- `1:33:33PM`

**`default`** ['hh:mm', 'hh:mm:ss.sss']

___

## Number

### currencySymbol 

• **currencySymbol**: *string[]*

*Defined in [src/ConfigParams.ts:71](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L71)*

Sets symbols that denote currency numbers.

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ['$']

___

### decimalSeparator 

• **decimalSeparator**: *"." | ","*

*Defined in [src/ConfigParams.ts:119](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L119)*

Sets a decimal separator used for parsing numerical literals.

Can be one of the following:
- `.` (period)
- `,` (comma)

Must be different from [thousandSeparator](/docs/api/interfaces/configparams.md#thousandseparator) and [functionArgSeparator](/docs/api/interfaces/configparams.md#functionargseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** '.'

___

### precisionEpsilon 

• **precisionEpsilon**: *number*

*Defined in [src/ConfigParams.ts:277](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L277)*

Sets how far two numerical values need to be from each other to be treated as non-equal.

`a` and `b` are equal if all three of the following conditions are met:
- Both `a` and `b` are of the same sign
- `abs(a)` <= `(1+precisionEpsilon) * abs(b)`
- `abs(b)` <= `(1+precisionEpsilon) * abs(a)`

Additionally, this option controls the snap-to-zero behavior for additions and subtractions:
- For `c=a+b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`
- For `c=a-b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`

**`default`** 1e-13

___

### precisionRounding 

• **precisionRounding**: *number*

*Defined in [src/ConfigParams.ts:292](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L292)*

Sets the precision level of calculations' output.

Internally, all arithmetic operations are performed using JavaScript's built-in numbers.
But when HyperFormula exports a cell's value, it rounds the output
to the `precisionRounding` number of significant digits.

Setting `precisionRounding` too low can cause large numbers' imprecision
(for example, with `precisionRounding` set to `4`, 100005 becomes 100010).

Setting precisionRounding too high will expose the floating-point calculation errors. For example, with `precisionRounding` set to `15`, `0.1 + 0.2` results in `0.3000000000000001`.

**`default`** 10

___

### smartRounding 

• **smartRounding**: *boolean*

*Defined in [src/ConfigParams.ts:336](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L336)*

When set to `false`, no rounding happens, and numbers are equal if and only if they are of truly identical value.

For more information, see [precisionEpsilon](/docs/api/interfaces/configparams.md#precisionepsilon).

**`default`** true

___

### stringifyCurrency 

• **stringifyCurrency**: *function*

*Defined in [src/ConfigParams.ts:328](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L328)*

Sets a function that converts numeric values into currency-formatted strings.

The function receives the raw value and the format string passed to `TEXT`
and should return a string or `undefined`. The formatter calls this for
every format string that reaches it, not only currency-shaped ones — return
`undefined` for any format your callback does not handle and HyperFormula
will fall through to the built-in number formatter.

For more information, see the [Currency handling guide](/docs/guide/currency-handling.md).

**`default`** defaultStringifyCurrency

#### Type declaration:

▸ (`value`: number, `currencyFormat`: string): *[Maybe](../globals.md#maybe)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |
`currencyFormat` | string |

___

### thousandSeparator 

• **thousandSeparator**: *"" | "," | " " | "."*

*Defined in [src/ConfigParams.ts:351](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L351)*

Sets the thousands' separator symbol for parsing numerical literals.

Can be one of the following:
- empty
- `,` (comma)
- ` ` (empty space)

Must be different from [decimalSeparator](/docs/api/interfaces/configparams.md#decimalseparator) and [functionArgSeparator](/docs/api/interfaces/configparams.md#functionargseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ''

___

## String

### accentSensitive 

• **accentSensitive**: *boolean*

*Defined in [src/ConfigParams.ts:20](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L20)*

When set to `true`, makes string comparison accent-sensitive.

Applies only to comparison operators.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### caseFirst 

• **caseFirst**: *"upper" | "lower" | "false"*

*Defined in [src/ConfigParams.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L42)*

When set to `upper`, upper case sorts first.

When set to `lower`, lower case sorts first.

When set to `false`, uses the locale's default.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** 'lower'

___

### caseSensitive 

• **caseSensitive**: *boolean*

*Defined in [src/ConfigParams.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L30)*

When set to `true`, makes string comparison case-sensitive.

Applies to comparison operators only.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### ignorePunctuation 

• **ignorePunctuation**: *boolean*

*Defined in [src/ConfigParams.ts:142](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L142)*

When set to `true`, string comparison ignores punctuation.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### localeLang 

• **localeLang**: *string*

*Defined in [src/ConfigParams.ts:192](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L192)*

Sets the locale for language-sensitive string comparison.

Accepts **IETF BCP 47** language tags.

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** 'en'

___

### matchWholeCell 

• **matchWholeCell**: *boolean*

*Defined in [src/ConfigParams.ts:200](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L200)*

When set to `true`, function criteria require whole cells to match the pattern.

When set to `false`, function criteria require just a sub-word to match the pattern.

**`default`** true

___

### useRegularExpressions 

• **useRegularExpressions**: *boolean*

*Defined in [src/ConfigParams.ts:441](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L441)*

When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) are allowed to use regular expressions.

**`default`** false

___

### useWildcards 

• **useWildcards**: *boolean*

*Defined in [src/ConfigParams.ts:447](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L447)*

When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) can use the `*` and `?` wildcards.

**`default`** true