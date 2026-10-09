# Config

## Constructors

### constructor 

\+ **new Config**(`options`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `showDeprecatedWarns`: boolean, `notifyLicenseMessages`: boolean): *[Config](config.md)*

*Defined in [src/Config.ts:181](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L181)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | Partial‹[ConfigParams](../interfaces/configparams.md)› | {} |
`showDeprecatedWarns` | boolean | true |
`notifyLicenseMessages` | boolean | true |

**Returns:** *[Config](config.md)*

## Properties

### accentSensitive

• **accentSensitive**: *boolean*

*Defined in [src/Config.ts:94](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L94)*

When set to `true`, makes string comparison accent-sensitive.

Applies only to comparison operators.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### arrayColumnSeparator

• **arrayColumnSeparator**: *"," | ";"*

*Defined in [src/Config.ts:104](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L104)*

Sets a column separator symbol for array notation.

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** ','

___

### arrayRowSeparator

• **arrayRowSeparator**: *";" | "|"*

*Defined in [src/Config.ts:106](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L106)*

Sets a row separator symbol for array notation.

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** ';'

___

### caseFirst

• **caseFirst**: *"upper" | "lower" | "false"*

*Defined in [src/Config.ts:96](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L96)*

When set to `upper`, upper case sorts first.

When set to `lower`, lower case sorts first.

When set to `false`, uses the locale's default.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** 'lower'

___

### caseSensitive

• **caseSensitive**: *boolean*

*Defined in [src/Config.ts:90](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L90)*

When set to `true`, makes string comparison case-sensitive.

Applies to comparison operators only.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### chooseAddressMappingPolicy

• **chooseAddressMappingPolicy**: *ChooseAddressMapping*

*Defined in [src/Config.ts:92](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L92)*

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

*Defined in [src/Config.ts:157](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L157)*

A generic parameter that can be used to pass data to custom functions.

For more information, see the [Custom functions guide](/docs/guide/custom-functions.md).

**`default`** undefined

___

### currencySymbol

• **currencySymbol**: *string[]*

*Defined in [src/Config.ts:151](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L151)*

Sets symbols that denote currency numbers.

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ['$']

___

### dateFormats

• **dateFormats**: *string[]*

*Defined in [src/Config.ts:98](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L98)*

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

### decimalSeparator

• **decimalSeparator**: *"." | ","*

*Defined in [src/Config.ts:108](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L108)*

Sets a decimal separator used for parsing numerical literals.

Can be one of the following:
- `.` (period)
- `,` (comma)

Must be different from [thousandSeparator](/docs/api/interfaces/configparams.md#thousandseparator) and [functionArgSeparator](/docs/api/interfaces/configparams.md#functionargseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** '.'

___

### evaluateNullToZero

• **evaluateNullToZero**: *boolean*

*Defined in [src/Config.ts:127](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L127)*

When set to `true`, formulas evaluating to `null` evaluate to `0` instead.

**`default`** false

___

### functionArgSeparator

• **functionArgSeparator**: *string*

*Defined in [src/Config.ts:102](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L102)*

Sets a separator character that separates procedure arguments in formulas.

Must be different from [decimalSeparator](/docs/api/interfaces/configparams.md#decimalseparator) and [thousandSeparator](/docs/api/interfaces/configparams.md#thousandseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ','

___

### functionPlugins

• **functionPlugins**: *FunctionPluginDefinition[]*

*Defined in [src/Config.ts:119](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L119)*

Lists additional function plugins to be used by the formula interpreter.

For more information, see the [Custom functions guide](/docs/guide/custom-functions.md).

**`default`** []

___

### ignorePunctuation

• **ignorePunctuation**: *boolean*

*Defined in [src/Config.ts:123](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L123)*

When set to `true`, string comparison ignores punctuation.

For more information, see the [Types of operators guide](/docs/guide/types-of-operators.md#comparing-strings).

**`default`** false

___

### ignoreWhiteSpace

• **ignoreWhiteSpace**: *"standard" | "any"*

*Defined in [src/Config.ts:114](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L114)*

Controls the set of whitespace characters that are allowed inside a formula.

When set to `'standard'`, allows only SPACE (U+0020), CHARACTER TABULATION (U+0009), LINE FEED (U+000A), and CARRIAGE RETURN (U+000D) (compliant with OpenFormula Standard 1.3)

When set to `'any'`, allows all whitespace characters that would be captured by the `\s` character class of the JavaScript regular expressions.

**`default`** 'standard'

___

### language

• **language**: *string*

*Defined in [src/Config.ts:112](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L112)*

Sets a translation package for function and error names.

For more information, see the [Localizing functions guide](/docs/guide/localizing-functions.md).

**`default`** 'enGB'

___

### leapYear1900

• **leapYear1900**: *boolean*

*Defined in [src/Config.ts:121](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L121)*

Sets year 1900 as a leap year.

For compatibility with Lotus 1-2-3 and Microsoft Excel, set this option to `true`.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md) and [nullDate](/docs/api/interfaces/configparams.md#nulldate).

**`default`** false

___

### licenseKey

• **licenseKey**: *string*

*Defined in [src/Config.ts:116](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L116)*

Sets your HyperFormula license key.

To use HyperFormula on the GPLv3 license terms, set this option to `gpl-v3`.

To use HyperFormula with your proprietary license, set this option to your valid license key string.

For more information, go [here](/docs/guide/license-key.md).

**`default`** undefined

___

### localeLang

• **localeLang**: *string*

*Defined in [src/Config.ts:125](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L125)*

Sets the locale for language-sensitive string comparison.

Accepts **IETF BCP 47** language tags.

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** 'en'

___

### matchWholeCell

• **matchWholeCell**: *boolean*

*Defined in [src/Config.ts:181](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L181)*

When set to `true`, function criteria require whole cells to match the pattern.

When set to `false`, function criteria require just a sub-word to match the pattern.

**`default`** true

___

### maxColumns

• **maxColumns**: *number*

*Defined in [src/Config.ts:168](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L168)*

Sets the maximum number of columns.

**`default`** 18.278 (Columns A, B, ..., ZZZ)

___

### maxPendingLazyTransformations

• **maxPendingLazyTransformations**: *number*

*Defined in [src/Config.ts:155](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L155)*

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

*Defined in [src/Config.ts:166](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L166)*

Sets the maximum number of rows.

**`default`** 40.000

___

### nullDate

• **nullDate**: *[SimpleDate](../interfaces/simpledate.md)*

*Defined in [src/Config.ts:149](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L149)*

Internally, each date is represented as a number of days that passed since `nullDate`.

This option sets a specific date from which that number of days is counted.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** {year: 1899, month: 12, day: 30}

___

### nullYear

• **nullYear**: *number*

*Defined in [src/Config.ts:129](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L129)*

Sets the interpretation of two-digit year values.

Two-digit year values (`xx`) can either become `19xx` or `20xx`.

If `xx` is less or equal to `nullYear`, two-digit year values become `20xx`.

If `xx` is more than `nullYear`, two-digit year values become `19xx`.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** 30

___

### parseDateTime

• **parseDateTime**: *function*

*Defined in [src/Config.ts:131](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L131)*

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

### precisionEpsilon

• **precisionEpsilon**: *number*

*Defined in [src/Config.ts:139](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L139)*

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

*Defined in [src/Config.ts:141](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L141)*

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

*Defined in [src/Config.ts:143](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L143)*

When set to `false`, no rounding happens, and numbers are equal if and only if they are of truly identical value.

For more information, see [precisionEpsilon](/docs/api/interfaces/configparams.md#precisionepsilon).

**`default`** true

___

### stringifyCurrency

• **stringifyCurrency**: *function*

*Defined in [src/Config.ts:137](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L137)*

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

### stringifyDateTime

• **stringifyDateTime**: *function*

*Defined in [src/Config.ts:133](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L133)*

Sets a function that converts date-time values into strings.

The function should return a string or undefined.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** defaultStringifyDateTime

#### Type declaration:

▸ (`date`: [SimpleDateTime](../globals.md#simpledatetime), `formatArg`: string): *[Maybe](../globals.md#maybe)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDateTime](../globals.md#simpledatetime) |
`formatArg` | string |

___

### stringifyDuration

• **stringifyDuration**: *function*

*Defined in [src/Config.ts:135](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L135)*

Sets a function that converts time duration values into strings.

The function should return a string or undefined.

For more information, see the [Date and time handling guide](/docs/guide/date-and-time-handling.md).

**`default`** defaultStringifyDuration

#### Type declaration:

▸ (`time`: [SimpleTime](../interfaces/simpletime.md), `formatArg`: string): *[Maybe](../globals.md#maybe)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`time` | [SimpleTime](../interfaces/simpletime.md) |
`formatArg` | string |

___

### thousandSeparator

• **thousandSeparator**: *"" | "," | " " | "."*

*Defined in [src/Config.ts:110](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L110)*

Sets the thousands' separator symbol for parsing numerical literals.

Can be one of the following:
- empty
- `,` (comma)
- ` ` (empty space)

Must be different from [decimalSeparator](/docs/api/interfaces/configparams.md#decimalseparator) and [functionArgSeparator](/docs/api/interfaces/configparams.md#functionargseparator).

For more information, see the [Internationalization features guide](/docs/guide/i18n-features.md).

**`default`** ''

___

### timeFormats

• **timeFormats**: *string[]*

*Defined in [src/Config.ts:100](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L100)*

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

### undoLimit

• **undoLimit**: *number*

*Defined in [src/Config.ts:153](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L153)*

Sets the number of elements kept in the undo history.

For more information, see the [Undo-Redo guide](/docs/guide/undo-redo.md).

**`default`** 20

___

### useArrayArithmetic

• **useArrayArithmetic**: *boolean*

*Defined in [src/Config.ts:88](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L88)*

When set to `true`, array arithmetic is enabled globally.

When set to `false`, array arithmetic is enabled only inside array functions (`ARRAYFORMULA`, `FILTER`, and `ARRAY_CONSTRAIN`).

For more information, see the [Arrays guide](/docs/guide/arrays.md).

**`default`** false

___

### useColumnIndex

• **useColumnIndex**: *boolean*

*Defined in [src/Config.ts:145](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L145)*

When set to `true`, switches column search strategy from binary search to column index.

Using column index improves efficiency of the `VLOOKUP` and `MATCH` functions, but increases memory usage.

When searching with wildcards or regular expressions, column search strategy falls back to binary search (even with `useColumnIndex` set to `true`).

For more information, see the [Performance guide](/docs/guide/performance.md).

**`default`** false

___

### useRegularExpressions

• **useRegularExpressions**: *boolean*

*Defined in [src/Config.ts:177](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L177)*

When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) are allowed to use regular expressions.

**`default`** false

___

### useStats

• **useStats**: *boolean*

*Defined in [src/Config.ts:147](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L147)*

When set to `true`, enables gathering engine statistics and timings.

Useful for testing and benchmarking.

**`default`** false

___

### useWildcards

• **useWildcards**: *boolean*

*Defined in [src/Config.ts:179](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L179)*

When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) can use the `*` and `?` wildcards.

**`default`** true

## Methods

### getConfig 

▸ **getConfig**(): *[ConfigParams](../interfaces/configparams.md)*

*Defined in [src/Config.ts:364](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L364)*

**Returns:** *[ConfigParams](../interfaces/configparams.md)*

___

### mergeConfig 

▸ **mergeConfig**(`init`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `notifyLicenseMessages`: boolean): *[Config](config.md)*

*Defined in [src/Config.ts:368](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L368)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`init` | Partial‹[ConfigParams](../interfaces/configparams.md)› | - |
`notifyLicenseMessages` | boolean | true |

**Returns:** *[Config](config.md)*

## Object literals

### defaultConfig

### ▪ **defaultConfig**: *object*

*Defined in [src/Config.ts:44](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L44)*

### accentSensitive 

• **accentSensitive**: *false* = false

*Defined in [src/Config.ts:45](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L45)*

### arrayColumnSeparator 

• **arrayColumnSeparator**: *","* = ","

*Defined in [src/Config.ts:63](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L63)*

### arrayRowSeparator 

• **arrayRowSeparator**: *";"* = ";"

*Defined in [src/Config.ts:64](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L64)*

### caseFirst 

• **caseFirst**: *"lower"* = "lower"

*Defined in [src/Config.ts:48](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L48)*

### caseSensitive 

• **caseSensitive**: *false* = false

*Defined in [src/Config.ts:47](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L47)*

### chooseAddressMappingPolicy 

• **chooseAddressMappingPolicy**: *AlwaysDense‹›* = new AlwaysDense()

*Defined in [src/Config.ts:50](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L50)*

### context 

• **context**: *undefined* = undefined

*Defined in [src/Config.ts:49](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L49)*

### currencySymbol 

• **currencySymbol**: *string[]* = ['$']

*Defined in [src/Config.ts:46](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L46)*

### dateFormats 

• **dateFormats**: *string[]* = ['DD/MM/YYYY', 'DD/MM/YY']

*Defined in [src/Config.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L51)*

### decimalSeparator 

• **decimalSeparator**: *"."* = "."

*Defined in [src/Config.ts:52](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L52)*

### evaluateNullToZero 

• **evaluateNullToZero**: *false* = false

*Defined in [src/Config.ts:53](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L53)*

### functionArgSeparator 

• **functionArgSeparator**: *string* = ","

*Defined in [src/Config.ts:54](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L54)*

### functionPlugins 

• **functionPlugins**: *never[]* = []

*Defined in [src/Config.ts:55](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L55)*

### ignorePunctuation 

• **ignorePunctuation**: *false* = false

*Defined in [src/Config.ts:56](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L56)*

### ignoreWhiteSpace 

• **ignoreWhiteSpace**: *"standard"* = "standard"

*Defined in [src/Config.ts:58](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L58)*

### language 

• **language**: *string* = "enGB"

*Defined in [src/Config.ts:57](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L57)*

### leapYear1900 

• **leapYear1900**: *false* = false

*Defined in [src/Config.ts:60](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L60)*

### licenseKey 

• **licenseKey**: *string* = ""

*Defined in [src/Config.ts:59](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L59)*

### localeLang 

• **localeLang**: *string* = "en"

*Defined in [src/Config.ts:61](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L61)*

### matchWholeCell 

• **matchWholeCell**: *true* = true

*Defined in [src/Config.ts:62](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L62)*

### maxColumns 

• **maxColumns**: *number* = 18278

*Defined in [src/Config.ts:66](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L66)*

### maxPendingLazyTransformations 

• **maxPendingLazyTransformations**: *number* = 50

*Defined in [src/Config.ts:79](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L79)*

### maxRows 

• **maxRows**: *number* = 40000

*Defined in [src/Config.ts:65](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L65)*

### nullYear 

• **nullYear**: *number* = 30

*Defined in [src/Config.ts:67](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L67)*

### parseDateTime 

• **parseDateTime**: *[defaultParseToDateTime](../globals.md#defaultparsetodatetime)* = defaultParseToDateTime

*Defined in [src/Config.ts:69](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L69)*

### precisionEpsilon 

• **precisionEpsilon**: *number* = 1e-13

*Defined in [src/Config.ts:70](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L70)*

### precisionRounding 

• **precisionRounding**: *number* = 10

*Defined in [src/Config.ts:71](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L71)*

### smartRounding 

• **smartRounding**: *true* = true

*Defined in [src/Config.ts:72](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L72)*

### stringifyCurrency 

• **stringifyCurrency**: *[defaultStringifyCurrency](../globals.md#defaultstringifycurrency)* = defaultStringifyCurrency

*Defined in [src/Config.ts:75](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L75)*

### stringifyDateTime 

• **stringifyDateTime**: *[defaultStringifyDateTime](../globals.md#defaultstringifydatetime)* = defaultStringifyDateTime

*Defined in [src/Config.ts:73](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L73)*

### stringifyDuration 

• **stringifyDuration**: *[defaultStringifyDuration](../globals.md#defaultstringifyduration)* = defaultStringifyDuration

*Defined in [src/Config.ts:74](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L74)*

### thousandSeparator 

• **thousandSeparator**: *""* = ""

*Defined in [src/Config.ts:77](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L77)*

### timeFormats 

• **timeFormats**: *string[]* = ['hh:mm', 'hh:mm:ss.sss']

*Defined in [src/Config.ts:76](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L76)*

### undoLimit 

• **undoLimit**: *number* = 20

*Defined in [src/Config.ts:78](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L78)*

### useArrayArithmetic 

• **useArrayArithmetic**: *false* = false

*Defined in [src/Config.ts:84](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L84)*

### useColumnIndex 

• **useColumnIndex**: *false* = false

*Defined in [src/Config.ts:82](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L82)*

### useRegularExpressions 

• **useRegularExpressions**: *false* = false

*Defined in [src/Config.ts:80](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L80)*

### useStats 

• **useStats**: *false* = false

*Defined in [src/Config.ts:83](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L83)*

### useWildcards 

• **useWildcards**: *true* = true

*Defined in [src/Config.ts:81](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L81)*

▪ **nullDate**: *object*

*Defined in [src/Config.ts:68](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L68)*

* **day**: *number* = 30

* **month**: *number* = 12

* **year**: *number* = 1899