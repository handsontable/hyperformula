/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from '../Config'
import {TIME_FORMAT_SECONDS_ITEM_REGEXP} from '../DateTimeDefault'
import {DateTimeHelper, numberToSimpleTime, SimpleDateTime, SimpleTime} from '../DateTimeHelper'
import {RawScalarValue} from '../interpreter/InterpreterValue'
import {Maybe} from '../Maybe'
import {FormatToken, parseForDateTimeFormat, parseForNumberFormat, TokenType} from './parser'

/**
 * Detects Excel LCID-tagged currency tags (`[$SYMBOL-LCID]` with a non-empty
 * SYMBOL portion). Shared by `defaultStringifyDateTime` and
 * `defaultStringifyDuration` so a format string carrying such a tag short-
 * circuits both date and duration dispatch and falls through to the
 * number formatter (or the user-supplied `stringifyCurrency` callback).
 *
 * The pattern is intentionally unanchored: any occurrence of `[$SYMBOL-`
 * in the format string triggers the guard. Excel does not mix date/time
 * tokens with a currency tag in the same format string, so a mid-string
 * match cannot misclassify a legitimate composite — every observed
 * format string with a currency tag is currency-only.
 */
const LCID_CURRENCY_TAG = /\[\$[^\-\]]+-/

export function format(value: number, formatArg: string, config: Config, dateHelper: DateTimeHelper): RawScalarValue {
  // Currency callback runs first so a user-supplied stringifyCurrency can
  // intercept LCID-tagged or bare-letter currency formats before the
  // date/time parser greedily consumes characters like 'D', 'M', 'S', 'Y'
  // (e.g. '[$USD-409] #,##0.00' would otherwise become '[$US9-409] #,##0.00').
  // The default callback returns undefined for every input. For non-currency
  // formats (dates, durations, $#,##0.00, etc.) this preserves the existing
  // dispatch path bit-for-bit. For LCID-tagged currency formats (`[$SYMBOL-LCID] ...`)
  // the LCID guards in defaultStringifyDateTime/Duration also short-circuit,
  // so the value falls through to parseForNumberFormat — a deliberate change
  // versus pre-HF-24 behavior, where the date parser would mangle the symbol.
  const tryCurrency = config.stringifyCurrency(value, formatArg)
  if (tryCurrency !== undefined) {
    return tryCurrency
  }
  // Strip presentational color tags AFTER the (user-pluggable) currency callback
  // — which may inspect the raw formatArg — and BEFORE date/time dispatch. Doing
  // it here (not inside the number path) means a colored date like
  // `[Red]YYYY-MM-DD` loses only its color tag and still renders as a date, and
  // a color tag such as `[Red]` (which contains a `d`) can no longer be
  // hijacked by the date/time parser. See stripColorTags.
  const cleanedFormatArg = stripColorTags(formatArg)
  const tryDateTime = config.stringifyDateTime(dateHelper.numberToSimpleDateTime(value), cleanedFormatArg) // default points to defaultStringifyDateTime()
  if (tryDateTime !== undefined) {
    return tryDateTime
  }
  const tryDuration = config.stringifyDuration(numberToSimpleTime(value), cleanedFormatArg)
  if (tryDuration !== undefined) {
    return tryDuration
  }
  return formatNumberWithSections(cleanedFormatArg, value, config)
}

const COLOR_TAG_REGEX = /\[(black|blue|cyan|green|magenta|red|white|yellow|color\s?(?:[1-9]|[1-4]\d|5[0-6]))\]/gi

/**
 * Removes Excel color tags (`[Red]`, `[Blue]`, …, `[Color56]`) from a format
 * string. HyperFormula's `TEXT` output is a plain string with no color channel,
 * so presentational color tags are semantically meaningless and are simply
 * dropped.
 *
 * The whitelist is deliberately color-NAME-specific (flat alternation, no
 * nested quantifier) so it cannot clobber other bracketed tokens: duration
 * tags `[hh]`/`[mm]`, currency/locale tags `[$USD-409]`/`[$-409]`, and
 * condition tags `[>=100]` are all left untouched.
 *
 * @param formatArg the raw format string
 * @returns the format string with recognized color tags removed
 */
function stripColorTags(formatArg: string): string {
  return formatArg.replace(COLOR_TAG_REGEX, '')
}

/**
 * Splits an Excel number-format string into its sign-selected sections on
 * unescaped `;`, honoring `\;` escapes and `"…"` quoted literals so a semicolon
 * inside a quoted literal does not split. Excel uses up to four sections
 * (`positive;negative;zero;text`); only the first three are ever selected for a
 * numeric value, so no cap is enforced here — surplus sections are simply never
 * read.
 *
 * @param formatStr the (color-stripped) format string
 * @returns the list of raw section strings, in order
 */
function splitIntoSections(formatStr: string): string[] {
  const sections: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < formatStr.length; i++) {
    const ch = formatStr[i]

    if (ch === '\\') {
      // Keep the backslash and the escaped character together, verbatim.
      current += ch
      if (i + 1 < formatStr.length) {
        current += formatStr[i + 1]
        i++
      }
      continue
    }
    if (ch === '"') {
      inQuotes = !inQuotes
      current += ch
      continue
    }
    if (ch === ';' && !inQuotes) {
      sections.push(current)
      current = ''
      continue
    }
    current += ch
  }
  sections.push(current)

  return sections
}

/**
 * Strips the delimiting double-quotes from quoted literals so `"zł"` renders as
 * `zł`. NUANCE (documented, out of HF-287 scope): quotes are removed globally,
 * so digit/placeholder characters *inside* quotes are NOT protected from the
 * number tokenizer — a rare Excel case that this incremental formatter does not
 * cover.
 *
 * @param section a single format section
 * @returns the section with double-quote delimiters removed
 */
function stripQuotes(section: string): string {
  return section.replace(/"/g, '')
}

/**
 * Selects the format section for a value by its RAW sign (before rounding) and
 * returns the value to feed the formatter:
 *
 * - `> 0` → positive section (section 0), formatted signed (non-negative).
 * - `< 0` → negative section (section 1) when present, formatted on `abs` (the
 *   section's own literals, e.g. `(0.00)`, carry the sign); when only one
 *   section exists the signed value is passed so the formatter re-adds `-`
 *   (unless every rendered digit is zero — see `numberFormat`).
 * - `= 0` → zero section (section 2) when present, else the positive section.
 *
 * Excel-canonical fallbacks: 1 section → all values; 2 sections → `[pos+zero ;
 * neg]`; 3 sections → `[pos ; neg ; zero]`; a missing zero section falls back to
 * positive.
 *
 * @param sections the split format sections
 * @param value the numeric value being formatted
 * @returns the chosen section string and the (sign-adjusted) value to format
 */
function pickSection(sections: string[], value: number): { sectionStr: string, valueForFormat: number } {
  if (value < 0 && sections.length >= 2) {
    // Explicit negative section: its literals carry the sign, so format abs.
    return {sectionStr: sections[1], valueForFormat: Math.abs(value)}
  }
  if (value === 0 && sections.length >= 3) {
    return {sectionStr: sections[2], valueForFormat: 0}
  }
  // Positive, zero-without-a-zero-section, or single-section negative (the
  // signed value flows through so numberFormat re-adds the leading `-`).
  return {sectionStr: sections[0], valueForFormat: value}
}

/**
 * Number path of the dispatcher: split the format into sign-selected sections,
 * pick the section for the value, tokenize it and render.
 *
 * When the SELECTED section carries no `#`/`0` placeholder it is pure literal
 * text (e.g. `"neg"`, an empty section, or a bare `Foo`): render THAT section's
 * literal characters — never the whole format string — so `0.00;"neg"` on a
 * negative renders `neg` (not `0.00;"neg"`) and an empty section renders `''`.
 * A single literal section preserves `format(2, 'Foo')` → `'Foo'`. Never throws.
 *
 * @param formatArg the color-stripped format string
 * @param value the numeric value being formatted
 * @param config the live HyperFormula config (separators)
 * @returns the formatted string
 */
function formatNumberWithSections(formatArg: string, value: number, config: Config): RawScalarValue {
  const sections = splitIntoSections(formatArg)
  const {sectionStr, valueForFormat} = pickSection(sections, value)
  const expression = parseForNumberFormat(stripQuotes(sectionStr))
  if (expression === undefined) {
    return renderLiteralSection(sectionStr)
  }
  return numberFormat(expression.tokens, valueForFormat, config)
}

/**
 * Renders a placeholder-less format section as literal text: double-quote
 * delimiters are removed (`"z"` → `z`) and backslash escapes are resolved
 * (`\-` → `-`). Used when the section selected for a value's sign carries no
 * `#`/`0` placeholder, so the value is never spliced in — only the section's
 * own literal characters are emitted (an empty section renders `''`). Mirrors
 * Excel, where a literal-only section shows just its text.
 *
 * @param section the raw (unstripped) format section
 * @returns the section's literal text
 */
function renderLiteralSection(section: string): string {
  let result = ''
  for (let i = 0; i < section.length; i++) {
    const ch = section[i]
    if (ch === '\\' && i + 1 < section.length) {
      result += section[i + 1]
      i++
    } else if (ch !== '"') {
      result += ch
    }
  }
  return result
}

/**
 * Inserts a grouping separator every three digits from the right of a run of
 * digits (e.g. `1234567` → `1,234,567`). The caller guarantees `digits` is a
 * pure-digit string and `separator` is non-empty.
 *
 * @param digits a pure-digit integer string
 * @param separator the grouping glyph (from `config.thousandSeparator`)
 * @returns the grouped digit string
 */
function insertGrouping(digits: string, separator: string): string {
  let result = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      result += separator
    }
    result += digits[i]
  }
  return result
}

export function padLeft(number: number | string, size: number) {
  let result = `${number}`
  while (result.length < size) {
    result = '0' + result
  }
  return result
}

export function padRight(number: number | string, size: number) {
  let result = `${number}`
  while (result.length < size) {
    result = result + '0'
  }
  return result
}

function countChars(text: string, char: string) {
  return text.split(char).length - 1
}

/**
 * Renders a single sign-selected section's tokens against a value.
 *
 * The sign is extracted up front: the value is formatted on its magnitude
 * (`Math.abs`) and a leading `-` is prepended to the whole result iff the value
 * is negative AND some rendered digit is non-zero — Excel displays a magnitude
 * that rounds to zero unsigned (`TEXT(-0.4,"0")` → `0`, not `-0`). Only this
 * implicit sign is suppressed: an explicit `-` literal in the mask (`0;-0`)
 * flows through the FREE_TEXT path and still prints. Callers pass `abs` for an
 * explicit negative section (whose own literals carry the sign) and the signed
 * value for a single-section mask (so the `-` is re-added here) — see
 * `pickSection`.
 *
 * Per integer-format token:
 * - a *trailing* comma run (Excel's scaler, OUT of HF-287 scope) is peeled off
 *   and re-emitted as a literal so the output is recognizably un-scaled rather
 *   than silently mis-scaled;
 * - grouping is requested when an *interior* comma exists (`#,##0`), and the
 *   grouping glyph is `config.thousandSeparator` (empty on default config → no
 *   visible glyph);
 * - the decimal glyph is `config.decimalSeparator` (was a hardcoded `.`).
 *
 * @param tokens the tokenized number-format section
 * @param value the sign-adjusted numeric value to render
 * @param config the live config (grouping / decimal separators)
 * @returns the rendered section string
 */
function numberFormat(tokens: FormatToken[], value: number, config: Config): RawScalarValue {
  const negative = value < 0
  const absValue = Math.abs(value)
  let result = ''
  let hasNonZeroDigit = false

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    const tokenParts = token.value.split('.')
    const rawIntegerFormat = tokenParts[0]
    const decimalFormat = tokenParts[1] || ''
    const separator = tokenParts[1] ? config.decimalSeparator : ''

    /* peel off a trailing comma run (Excel scaler — kept as a visible literal) */
    const trailingScalerMatch = /,+$/.exec(rawIntegerFormat)
    const trailingScaler = trailingScalerMatch ? trailingScalerMatch[0] : ''
    const coreIntegerFormat = rawIntegerFormat.slice(0, rawIntegerFormat.length - trailingScaler.length)

    /* grouping requested iff a comma sits between two digit placeholders */
    const grouping = /[#0],[#0]/.test(coreIntegerFormat)
    const integerSkeleton = coreIntegerFormat.replace(/,/g, '')

    /* get fixed-point digits (huge magnitudes expanded — see stringifyMagnitude) */
    let {integerPart, decimalPart} = stringifyMagnitude(absValue, decimalFormat.length)

    /* the signed-zero check reads the ROUNDED digits before padding/grouping,
     * which only ever add zeros and separator glyphs */
    if (/[1-9]/.test(integerPart + decimalPart)) {
      hasNonZeroDigit = true
    }

    if (integerSkeleton.length > integerPart.length) {
      const padSizeInteger = countChars(integerSkeleton.substr(0, integerSkeleton.length - integerPart.length), '0')
      integerPart = padLeft(integerPart, padSizeInteger + integerPart.length)
    }

    /* group only after padding, only with a configured glyph, only on pure digits
     * (defensive: huge magnitudes arrive pre-expanded from scientific notation by
     * stringifyMagnitude, but a non-finite value still stringifies as `Infinity`) */
    if (grouping && config.thousandSeparator !== '' && /^\d+$/.test(integerPart)) {
      integerPart = insertGrouping(integerPart, config.thousandSeparator)
    }

    const padSizeDecimal = countChars(decimalFormat.substr(decimalPart.length, decimalFormat.length - decimalPart.length), '0')
    decimalPart = padRight(decimalPart, padSizeDecimal + decimalPart.length)

    result += integerPart + trailingScaler + separator + decimalPart
  }

  /* Excel drops the implicitly-prepended minus when every rendered digit is
   * zero after rounding (`TEXT(-0.4,"0")` → `0`, not `-0`); an explicit `-`
   * literal in the mask is FREE_TEXT and has already been emitted above. */
  return negative && hasNonZeroDigit ? '-' + result : result
}

/**
 * Stringifies the integer and fractional digits of a magnitude for rendering:
 * the value is rounded to `decimalPlaces` and split on the dot, with the
 * trailing zeros of the fraction dropped (the placeholder padding re-adds
 * them).
 *
 * Doubles `>= 1e21` stringify in scientific notation (`1e+21`), which would
 * defeat placeholder padding and grouping, so they are expanded to their exact
 * decimal digits via `BigInt` instead — every such double is integer-valued.
 * NOTE: beyond 15 significant digits Excel displays zeros while the double's
 * exact expansion may carry non-zero tail digits; HyperFormula renders the
 * double's exact value (measured equal to Excel for the round `1e21` case).
 *
 * @param absValue the non-negative magnitude to stringify
 * @param decimalPlaces the number of decimal places requested by the format
 * @returns the integer digits and the trailing-zero-free fractional digits
 */
function stringifyMagnitude(absValue: number, decimalPlaces: number): { integerPart: string, decimalPart: string } {
  if (absValue >= 1e21 && Number.isFinite(absValue)) {
    return {integerPart: BigInt(absValue).toString(), decimalPart: ''}
  }
  const valueParts = Number(absValue.toFixed(decimalPlaces)).toString().split('.')
  return {integerPart: valueParts[0] || '', decimalPart: valueParts[1] || ''}
}

/**
 * Default `stringifyDuration` callback — formats a duration value against an
 * Excel-style time format string (e.g. `[hh]:mm:ss`).
 *
 * Returns `undefined` for format strings that are not duration formats so the
 * dispatcher in `format()` can fall through to other handlers.
 *
 * **LCID currency-tag guard** — sibling to the same guard in
 * `defaultStringifyDateTime`; explicitly returns `undefined` for Excel
 * currency tags `[$SYMBOL-LCID]` because the SYMBOL portion contains
 * duration-token letters (`H` in CHF/HUF, `m` in AMD/HMD) that
 * `parseForDateTimeFormat` would otherwise interpret as time tokens and
 * mangle the output. See `defaultStringifyDateTime` for the full
 * symbol-vs-locale-modifier rationale and the historical pre-HF-24
 * behaviour the guard corrects.
 *
 * @param time parsed duration value to render
 * @param formatArg Excel-style format string
 * @returns formatted string, or `undefined` to defer to the next dispatch step
 */
export function defaultStringifyDuration(time: SimpleTime, formatArg: string): Maybe<string> {
  if (LCID_CURRENCY_TAG.test(formatArg)) {
    return undefined
  }
  const expression = parseForDateTimeFormat(formatArg)
  if (expression === undefined) {
    return undefined
  }
  const tokens = expression.tokens
  let result = ''

  for (const token of tokens) {
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    switch (token.value.toLowerCase()) {
      case 'h':
      case 'hh': {
        result += padLeft(time.hours, token.value.length)
        time.hours = 0
        break
      }

      case '[hh]': {
        result += padLeft(time.hours, token.value.length - 2)
        time.hours = 0
        break
      }

      case 'm':
      case 'mm': {
        result += padLeft(time.minutes, token.value.length)
        time.minutes = 0
        break
      }

      case '[mm]': {
        result += padLeft(time.minutes + 60 * time.hours, token.value.length - 2)
        time.minutes = 0
        time.hours = 0
        break
      }

      /* seconds */
      case 's':
      case 'ss': {
        result += padLeft(Math.floor(time.seconds), token.value.length)
        break
      }

      default: {
        if (TIME_FORMAT_SECONDS_ITEM_REGEXP.test(token.value)) {
          const fractionOfSecondPrecision = Math.max(token.value.length - 3, 0)
          result += `${time.seconds < 10 ? '0' : ''}${Math.floor(time.seconds * Math.pow(10, fractionOfSecondPrecision)) / Math.pow(10, fractionOfSecondPrecision)}`
          continue
        }
        return undefined
      }
    }
  }
  return result
}

/**
 * Default `stringifyDateTime` callback — formats a date/time value against an
 * Excel-style format string (e.g. `YYYY-MM-DD HH:mm:ss`).
 *
 * Returns `undefined` for format strings that are not date/time formats so the
 * dispatcher in `format()` can fall through to `parseForNumberFormat` (or to a
 * user-supplied `stringifyCurrency` callback for currency-tagged formats).
 *
 * **LCID currency-tag guard** — explicitly returns `undefined` for Excel
 * currency tags `[$SYMBOL-LCID]` (non-empty SYMBOL portion). Without the
 * guard, `parseForDateTimeFormat` greedily consumes letters like `D`/`M`/`S`/`Y`/`H`
 * inside the currency code (e.g. `D` in USD, `H` in CHF, `M`+`D` in AMD),
 * mangling the output of an `[$USD-409] #,##0.00` format into
 * `[$US9-409] #,##0.00` because `D` is read as a day token. The pre-HF-24
 * behaviour was to mis-format; the guarded return is the deliberate
 * correction, not a regression. Bit-for-bit compatibility is preserved for
 * every non-currency format (dates, durations, `$#,##0.00`, etc.).
 *
 * The guard pattern (`/\[\$[^\-\]]+-/`) requires ≥1 character between `[$`
 * and `-` so it distinguishes currency tags (`[$USD-409]`, `[$€-2]`) from
 * Excel's locale-only modifier (`[$-409]`, `[$-F800]`), which is valid on
 * date/time formats and must continue to flow through this function.
 *
 * @param dateTime parsed date/time value to render
 * @param formatArg Excel-style format string
 * @returns formatted string, or `undefined` to defer to the next dispatch step
 */
export function defaultStringifyDateTime(dateTime: SimpleDateTime, formatArg: string): Maybe<string> {
  if (LCID_CURRENCY_TAG.test(formatArg)) {
    return undefined
  }
  const expression = parseForDateTimeFormat(formatArg)
  if (expression === undefined) {
    return undefined
  }
  const tokens = expression.tokens
  let result = ''
  let minutes: boolean = false

  const ampm = tokens.some((token) => token.type === TokenType.FORMAT &&
    (token.value === 'a/p' || token.value === 'A/P' || token.value === 'am/pm' || token.value === 'AM/PM'))

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    switch (token.value.toLowerCase()) {
      /* hours*/
      case 'h':
      case 'hh': {
        minutes = true
        result += padLeft(ampm ? (dateTime.hours + 11) % 12 + 1 : dateTime.hours, token.value.length)
        break
      }

      /* days */
      case 'd':
      case 'dd': {
        result += padLeft(dateTime.day, token.value.length)
        break
      }

      /* seconds */
      case 's':
      case 'ss': {
        result += padLeft(Math.floor(dateTime.seconds), token.value.length)
        break
      }

      /* minutes / months */
      case 'm':
      case 'mm': {
        if (i + 1 < tokens.length && tokens[i + 1].value.startsWith(':')) {
          minutes = true
        }
        if (minutes) {
          result += padLeft(dateTime.minutes, token.value.length)
        } else {
          result += padLeft(dateTime.month, token.value.length)
        }
        minutes = true
        break
      }

      /* years */
      case 'yy': {
        result += padLeft(dateTime.year % 100, token.value.length)
        break
      }
      case 'yyyy': {
        result += dateTime.year
        break
      }

      /* AM / PM */
      case 'am/pm':
      case 'a/p': {
        const [am, pm] = token.value.split('/')
        result += dateTime.hours < 12 ? am : pm
        break
      }
      default: {
        if (TIME_FORMAT_SECONDS_ITEM_REGEXP.test(token.value)) {
          const fractionOfSecondPrecision = token.value.length - 3
          result += `${dateTime.seconds < 10 ? '0' : ''}${Math.floor(dateTime.seconds * Math.pow(10, fractionOfSecondPrecision)) / Math.pow(10, fractionOfSecondPrecision)}`
          continue
        }
        return undefined
      }
    }
  }

  return result
}

/**
 * Default implementation of the `stringifyCurrency` config option.
 *
 * Returning `undefined` instructs the formatter to fall through to the
 * built-in number formatter, preserving HyperFormula's zero-dependency
 * default behavior. Replace this default by setting the
 * [`stringifyCurrency`](../../api/interfaces/configparams.md#stringifycurrency)
 * config option.
 *
 * @param _value - the numeric value to format (unused in default).
 * @param _formatArg - the format string passed to `TEXT` (unused in default).
 * @returns `undefined` — caller should fall through to the built-in formatter.
 */
export function defaultStringifyCurrency(_value: number, _formatArg: string): Maybe<string> {
  return undefined
}
