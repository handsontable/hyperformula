/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ChooseAddressMapping} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {DateTime, SimpleDate, SimpleDateTime, SimpleTime} from './DateTimeHelper'
import {Maybe} from './Maybe'

export interface ConfigParams {
  /**
   * When set to `true`, makes string comparison accent-sensitive.
   *
   * Applies only to comparison operators.
   * @default false
   * @category String
   */
  accentSensitive: boolean,
  /**
   * When set to `true`, allows circular references in formulas (up to a fixed iteration limit).
   * @default false
   * @category Engine
   */
  allowCircularReferences: boolean,
  /**
   * When set to `true`, makes string comparison case-sensitive.
   *
   * Applies to comparison operators only.
   * @default false
   * @category String
   */
  caseSensitive: boolean,
  /**
   * When set to `upper`, upper case sorts first.
   *
   * When set to `lower`, lower case sorts first.
   *
   * When set to `false`, uses the locale's default.
   * @default 'lower'
   * @category String
   */
  caseFirst: 'upper' | 'lower' | 'false',
  /**
   * Sets the address mapping policy to be used.
   *
   * Built-in implementations:
   * - `DenseSparseChooseBasedOnThreshold`: sets the address mapping policy separately for each sheet, based on fill ratio.
   * - `AlwaysDense`: uses `DenseStrategy` for all sheets.
   * - `AlwaysSparse`: uses `SparseStrategy` for all sheets.
   * @default AlwaysDense
   * @category Engine
   */
  chooseAddressMappingPolicy: ChooseAddressMapping,
  /**
   * A generic parameter that can be used to pass data to custom functions.
   * @default undefined
   * @category Engine
   */
  context: unknown,
  /**
   * Sets symbols that denote currency numbers.
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   * @default ['$']
   * @category Number
   */
  currencySymbol: string[],
  /**
   * Sets the date formats accepted by the date-parsing function.
   *
   * A format must be specified as a string consisting of tokens and separators.
   *
   * Supported tokens:
   * - `DD` (day of month)
   * - `MM` (month as a number)
   * - `YYYY` (year as a 4-digit number)
   * - `YY` (year as a 2-digit number)
   *
   * Supported separators:
   * - `/` (slash)
   * - `-` (dash)
   * - `.` (dot)
   * - ` ` (empty space)
   *
   * Regardless of the separator specified in the format string, all of the above are accepted by the date-parsing function.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @default ['DD/MM/YYYY', 'DD/MM/YY']
   * @category Date and Time
   */
  dateFormats: string[],
  /**
   * Sets a separator character that separates procedure arguments in formulas.
   *
   * Must be different from [decimalSeparator](/api/interfaces/configparams.md#decimalseparator) and [thousandSeparator](/api/interfaces/configparams.md#thousandseparator).
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   * @default ','
   * @category Formula Syntax
   */
  functionArgSeparator: string,
  /**
   * Sets a decimal separator used for parsing numerical literals.
   *
   * Can be one of the following:
   * - `.` (period)
   * - `,` (comma)
   *
   * Must be different from [thousandSeparator](/api/interfaces/configparams.md#thousandseparator) and [functionArgSeparator](/api/interfaces/configparams.md#functionargseparator).
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   * @default '.'
   * @category Number
   */
  decimalSeparator: '.' | ',',
  /**
   * When set to `true`, formulas evaluating to `null` evaluate to `0` instead.
   * @default false
   * @category Engine
   */
  evaluateNullToZero: boolean,
  /**
   * Lists additional function plugins to be used by the formula interpreter.
   * @default []
   * @category Formula Syntax
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionPlugins: any[],
  /**
   * When set to `true`, string comparison ignores punctuation.
   * @default false
   * @category String
   */
  ignorePunctuation: boolean,
  /**
   * Sets a translation package for function and error names.
   *
   * For more information, see the [Localizing functions guide](/guide/localizing-functions.md).
   * @default 'enGB'
   * @category Formula Syntax
   */
  language: string,
  /**
   * Controls the set of whitespace characters that are allowed inside a formula.
   *
   * When set to `'standard'`, allows only SPACE (U+0020), CHARACTER TABULATION (U+0009), LINE FEED (U+000A), and CARRIAGE RETURN (U+000D) (compliant with OpenFormula Standard 1.3)
   *
   * When set to `'any'`, allows all whitespace characters that would be captured by the `\s` character class of the JavaScript regular expressions.
   * @default 'standard'
   * @category Formula Syntax
   */
  ignoreWhiteSpace: 'standard' | 'any',
  /**
   * Sets year 1900 as a leap year.
   *
   * For compatibility with Lotus 1-2-3 and Microsoft Excel, set this option to `true`.
   *
   * For more information, see [nullDate](/api/interfaces/configparams.md#nulldate).
   * @default false
   * @category Date and Time
   */
  leapYear1900: boolean,
  /**
   * Sets your HyperFormula license key.
   *
   * To use HyperFormula on the GPLv3 license terms, set this option to `gpl-v3`.
   *
   * To use HyperFormula with your proprietary license, set this option to your valid license key string.
   *
   * For more information, go [here](/guide/license-key.md).
   * @default undefined
   * @category License
   */
  licenseKey: string,
  /**
   * Sets the locale for language-sensitive string comparison.
   *
   * Accepts **IETF BCP 47** language tags.
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   * @default 'en'
   * @category String
   */
  localeLang: string,
  /**
   * When set to `true`, function criteria require whole cells to match the pattern.
   *
   * When set to `false`, function criteria require just a sub-word to match the pattern.
   * @default true
   * @category String
   */
  matchWholeCell: boolean,
  /**
   * Sets a column separator symbol for array notation.
   * @default ','
   * @category Formula Syntax
   */
  arrayColumnSeparator: ',' | ';',
  /**
   * Sets a row separator symbol for array notation.
   * @default ';'
   * @category Formula Syntax
   */
  arrayRowSeparator: ';' | '|',
  /**
   * Sets the maximum number of rows.
   * @default 40.000
   * @category Engine
   */
  maxRows: number,
  /**
   * Sets the maximum number of columns.
   * @default 18.278 (Columns A, B, ..., ZZZ)
   * @category Engine
   */
  maxColumns: number,
  /**
   * Internally, each date is represented as a number of days that passed since `nullDate`.
   *
   * This option sets a specific date from which that number of days is counted.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @default {year: 1899, month: 12, day: 30}
   * @category Date and Time
   */
  nullDate: SimpleDate,
  /**
   * Sets the interpretation of two-digit year values.
   *
   * Two-digit year values (`xx`) can either become `19xx` or `20xx`.
   *
   * If `xx` is less or equal to `nullYear`, two-digit year values become `20xx`.
   *
   * If `xx` is more than `nullYear`, two-digit year values become `19xx`.
   * @default 30
   * @category Date and Time
   */
  nullYear: number,
  /**
   * Sets a function that parses strings representing date-time into actual date-time values.
   *
   * The function should return a [DateTime](../globals.md#datetime) object or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @default defaultParseToDateTime
   * @category Date and Time
   */
  parseDateTime: (dateTimeString: string, dateFormat?: string, timeFormat?: string) => Maybe<DateTime>,
  /**
   * Sets how far two numerical values need to be from each other to be treated as non-equal.
   *
   * `a` and `b` are equal if all three of the following conditions are met:
   * - Both `a` and `b` are of the same sign
   * - `abs(a)` <= `(1+precisionEpsilon) * abs(b)`
   * - `abs(b)` <= `(1+precisionEpsilon) * abs(a)`
   *
   * Additionally, this option controls the snap-to-zero behavior for additions and subtractions:
   * - For `c=a+b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`
   * - For `c=a-b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`
   * @default 1e-13
   * @category Number
   */
  precisionEpsilon: number,
  /**
   * Sets the precision level of calculations' output.
   *
   * Internally, all arithmetic operations are performed using JavaScript's built-in numbers.
   * But when HyperFormula exports a cell's value, it rounds the output
   * to the `precisionRounding` number of significant digits.
   *
   * Setting `precisionRounding` too low can cause large numbers' imprecision
   * (for example, with `precisionRounding` set to `4`, 100005 becomes 100010).
   *
   * Setting precisionRounding too high will expose the floating-point calculation errors. For example, with `precisionRounding` set to `15`, `0.1 + 0.2` results in `0.3000000000000001`.
   * @default 10
   * @category Number
   */
  precisionRounding: number,
  /**
   * Sets a function that converts date-time values into strings.
   *
   * The function should return a string or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @default defaultStringifyDateTime
   * @category Date and Time
   */
  stringifyDateTime: (dateTime: SimpleDateTime, dateTimeFormat: string) => Maybe<string>,
  /**
   * Sets a function that converts time duration values into strings.
   *
   * The function should return a string or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @default defaultStringifyDuration
   * @category Date and Time
   */
  stringifyDuration: (time: SimpleTime, timeFormat: string) => Maybe<string>,
  /**
   * When set to `false`, no rounding happens, and numbers are equal if and only if they are of truly identical value.
   *
   * For more information, see [precisionEpsilon](/api/interfaces/configparams.md#precisionepsilon).
   * @default true
   * @category Number
   */
  smartRounding: boolean,
  /**
   * Sets the thousands' separator symbol for parsing numerical literals.
   *
   * Can be one of the following:
   * - empty
   * - `,` (comma)
   * - ` ` (empty space)
   *
   * Must be different from [decimalSeparator](/api/interfaces/configparams.md#decimalseparator) and [functionArgSeparator](/api/interfaces/configparams.md#functionargseparator).
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   * @default ''
   * @category Number
   */
  thousandSeparator: '' | ',' | ' ' | '.',
  /**
   * Sets the time formats accepted by the time-parsing function.
   *
   * A format must be specified as a string consisting of at least two tokens separated by `:` (a colon).
   *
   * Supported tokens:
   * - `hh` (hours)
   * - `mm` (minutes)
   * - `ss`, `ss.s`, `ss.ss`, `ss.sss`, `ss.ssss`, etc. (seconds)
   *
   * The number of decimal places in the seconds token does not matter. All versions of the seconds token are equivalent in the context of parsing time values.
   * Regardless of the time format specified, the hours-minutes-seconds value may be followed by the AM/PM designator.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   * @example
   * E.g., for `timeFormats = ['hh:mm:ss.sss']`, valid time strings include:
   * - `1:33:33`
   * - `1:33:33.3`
   * - `1:33:33.33`
   * - `1:33:33.333`
   * - `01:33:33`
   * - `1:33:33 AM`
   * - `1:33:33 PM`
   * - `1:33:33 am`
   * - `1:33:33 pm`
   * - `1:33:33AM`
   * - `1:33:33PM`
   * @default ['hh:mm', 'hh:mm:ss.sss']
   * @category Date and Time
   */
  timeFormats: string[],
  /**
   * When set to `true`, array arithmetic is enabled globally.
   *
   * When set to `false`, array arithmetic is enabled only inside array functions (`ARRAYFORMULA`, `FILTER`, and `ARRAY_CONSTRAIN`).
   *
   * For more information, see the [Arrays guide](/guide/arrays.md).
   * @default false
   * @category Engine
   */
  useArrayArithmetic: boolean,
  /**
   * When set to `true`, switches column search strategy from binary search to column index.
   *
   * Using column index improves efficiency of the `VLOOKUP` and `MATCH` functions, but increases memory usage.
   *
   * When searching with wildcards or regular expressions, column search strategy falls back to binary search (even with `useColumnIndex` set to `true`).
   * @default false
   * @category Engine
   */
  useColumnIndex: boolean,
  /**
   * When set to `true`, enables gathering engine statistics and timings.
   *
   * Useful for testing and benchmarking.
   * @default false
   * @category Engine
   */
  useStats: boolean,
  /**
   * Sets the number of elements kept in the undo history.
   * @default 20
   * @category Undo and Redo
   */
  undoLimit: number,
  /**
   * When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) are allowed to use regular expressions.
   * @default false
   * @category String
   */
  useRegularExpressions: boolean,
  /**
   * When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) can use the `*` and `?` wildcards.
   * @default true
   * @category String
   */
  useWildcards: boolean,
}

export type ConfigParamsList = keyof ConfigParams
