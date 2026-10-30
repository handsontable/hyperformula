/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Maybe} from '../Maybe'

const dateFormatRegex = /(\\.|dd|DD|d|D|mm|MM|m|M|YYYY|YY|yyyy|yy|HH|hh|H|h|ss(\.(0+|s+))?|s|AM\/PM|am\/pm|A\/P|a\/p|\[mm]|\[MM]|\[hh]|\[HH])/g

/**
 * Number-format tokenizer regex.
 *
 * The class is intentionally FLAT — `[#0,]+(\.[#0]*)?` — admitting the grouping
 * comma alongside the `#`/`0` placeholders. Whether a comma means "group
 * thousands", a "trailing scaler", or neither is decided later by string
 * inspection in `format.ts`, never by regex structure.
 *
 * Synchronous catastrophic backtracking is not catchable by jest/jasmine
 * wall-clock timeouts, so this pattern MUST NOT be rewritten
 * into a nested-quantifier form such as `([#0]+,)*[#0]+`. Its shape is pinned
 * by a white-box test via {@link NUMBER_FORMAT_REGEX_SOURCE}.
 */
const numberFormatRegex = /(\\.|[#0,]+(\.[#0]*)?)/g

/**
 * The `source` of {@link numberFormatRegex}, exported for the white-box ReDoS
 * shape assertion. Not re-exported from `src/index.ts` — test-only internal.
 */
export const NUMBER_FORMAT_REGEX_SOURCE = numberFormatRegex.source

export enum TokenType {
  FORMAT = 'FORMAT',
  FREE_TEXT = 'FREE_TEXT',
}

export interface FormatToken {
  type: TokenType,
  value: string,
}

export function formatToken(type: TokenType, value: string): FormatToken {
  return {
    type,
    value,
  }
}

export enum FormatExpressionType {
  DATE = 'DATE',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
}

export interface FormatExpression {
  type: FormatExpressionType,
  tokens: FormatToken[],
}

/**
 * A run of a format string: either format code or a quoted literal (`"…"`).
 */
export interface FormatSegment {
  /** `true` for a quoted literal, `false` for format code. */
  quoted: boolean,
  /** The run as written in the format string, delimiting quotes included. */
  text: string,
}

/**
 * Splits a format string into format code and quoted literals.
 *
 * Text between double quotes is literal: it is never a digit placeholder, a
 * grouping comma, or a date/time token, so `"a0b" 0` with 5 renders `a0b 5`.
 * A quote with no closing quote runs to the end of the string, as in the
 * section splitter in `format.ts`. A backslash escape stays in the code run as
 * written, together with the character it escapes, so an escaped quote (`\"`)
 * does not open a quoted literal.
 *
 * @param str the format string
 * @returns the runs in order; empty runs are omitted
 */
export function splitQuotedLiterals(str: string): FormatSegment[] {
  const segments: FormatSegment[] = []
  let code = ''
  let i = 0

  while (i < str.length) {
    const ch = str[i]
    if (ch === '\\') {
      code += str.substr(i, 2)
      i += 2
    } else if (ch === '"') {
      if (code !== '') {
        segments.push({quoted: false, text: code})
        code = ''
      }
      const closingQuote = str.indexOf('"', i + 1)
      const end = closingQuote === -1 ? str.length : closingQuote + 1
      segments.push({quoted: true, text: str.substring(i, end)})
      i = end
    } else {
      code += ch
      i++
    }
  }
  if (code !== '') {
    segments.push({quoted: false, text: code})
  }

  return segments
}

/**
 * Splits a format string the way the tokenizers read it: as
 * {@link splitQuotedLiterals}, except that an empty quoted literal (`""`)
 * stands for no text, so it is dropped and the format code on both sides of it
 * is joined. `0""0` is read as `00`, and `mm"":ss` as `mm:ss`.
 *
 * @param str the format string
 * @returns the runs in order, with no empty quoted literal
 */
function splitForTokenizing(str: string): FormatSegment[] {
  const segments: FormatSegment[] = []
  for (const segment of splitQuotedLiterals(str)) {
    if (segment.quoted && quotedLiteralContent(segment.text) === '') {
      continue
    }
    const previous = segments[segments.length - 1]
    if (!segment.quoted && previous !== undefined && !previous.quoted) {
      previous.text += segment.text
    } else {
      segments.push({...segment})
    }
  }
  return segments
}

/**
 * Returns the text a quoted literal stands for: its content without the
 * delimiting quotes (`"a0b"` → `a0b`). An unterminated literal (`"abc` at the
 * end of a format) has no closing quote to remove.
 *
 * @param text a quoted literal as written, starting with `"`
 * @returns the literal's content
 */
export function quotedLiteralContent(text: string): string {
  return text.length > 1 && text.endsWith('"') ? text.slice(1, -1) : text.slice(1)
}

function matchDateFormat(str: string): RegExpExecArray[] {
  dateFormatRegex.lastIndex = 0
  const tokens: RegExpExecArray[] = []

  let m

  do {
    m = dateFormatRegex.exec(str)
    if (m !== null) {
      tokens.push(m)
    }
  } while (m)

  return tokens
}

function matchNumberFormat(str: string): RegExpExecArray[] {
  numberFormatRegex.lastIndex = 0

  // A run admitted by the flat class is only a genuine number token if it
  // contains at least one `#`/`0` placeholder. A run that is punctuation-only
  // (e.g. a lone grouping `,`, now inside the class) or an escape token is NOT
  // a number token — Excel treats a placeholder-less segment as a literal — so
  // skip it and keep scanning for the first placeholder-bearing run. Without
  // this guard a mask such as `,` or `a,b` would splice the value into free
  // text (`,` → `5,`); with it, `matchNumberFormat` still returns a single
  // token (the first real placeholder run), preserving the tokenizer contract.
  let match
  while ((match = numberFormatRegex.exec(str)) !== null) {
    if (!isEscapeToken(match) && /[#0]/.test(match[0])) {
      return [match]
    }
  }
  return []
}

function createTokens(regexTokens: RegExpExecArray[], str: string) {
  const tokens = []

  let start = 0
  for (let i = 0; i < regexTokens.length; ++i) {
    const token = regexTokens[i]

    if (token.index !== start) {
      const beforeToken = str.substr(start, token.index - start)
      tokens.push(formatToken(TokenType.FREE_TEXT, beforeToken))
    }
    if (token[0].startsWith('\\')) {
      tokens.push(formatToken(TokenType.FREE_TEXT, token[0]))
    } else {
      tokens.push(formatToken(TokenType.FORMAT, token[0]))
    }

    start = token.index + token[0].length
  }

  const lastToken = regexTokens[regexTokens.length - 1]

  if (lastToken.index + lastToken[0].length < str.length) {
    const afterLastToken = str.substr(lastToken.index + lastToken[0].length, str.length)
    tokens.push(formatToken(TokenType.FREE_TEXT, afterLastToken))
  }

  return tokens
}

/**
 * Tokenizes a date/time format. Only format code is searched for date/time
 * tokens; each quoted literal becomes free text with its quotes removed, so
 * `dd"mm"` renders the day followed by the text `mm`.
 *
 * @param str the format string
 * @returns the expression, or `undefined` when the format code holds no date/time token
 */
export function parseForDateTimeFormat(str: string): Maybe<FormatExpression> {
  const tokens: FormatToken[] = []
  let hasDateTimeToken = false

  for (const segment of splitForTokenizing(str)) {
    if (segment.quoted) {
      tokens.push(formatToken(TokenType.FREE_TEXT, quotedLiteralContent(segment.text)))
      continue
    }
    const dateFormatTokens = matchDateFormat(segment.text)
    if (dateFormatTokens.length === 0) {
      tokens.push(formatToken(TokenType.FREE_TEXT, segment.text))
      continue
    }
    if (!dateFormatTokens.every((elem) => isEscapeToken(elem))) {
      hasDateTimeToken = true
    }
    tokens.push(...createTokens(dateFormatTokens, segment.text))
  }

  return hasDateTimeToken ? {type: FormatExpressionType.DATE, tokens} : undefined
}

/**
 * Tokenizes a number format. The first placeholder run found in the format
 * code is the number token; quoted literals are never searched, and each
 * becomes free text with its quotes removed, so `"#"0` renders `#` followed by
 * the value.
 *
 * @param str the format string (a single section)
 * @returns the expression, or `undefined` when the format code holds no placeholder run
 */
export function parseForNumberFormat(str: string): Maybe<FormatExpression> {
  const tokens: FormatToken[] = []
  let hasNumberToken = false

  for (const segment of splitForTokenizing(str)) {
    if (segment.quoted) {
      tokens.push(formatToken(TokenType.FREE_TEXT, quotedLiteralContent(segment.text)))
      continue
    }
    const numberFormatTokens = hasNumberToken ? [] : matchNumberFormat(segment.text)
    if (numberFormatTokens.length === 0) {
      tokens.push(formatToken(TokenType.FREE_TEXT, segment.text))
      continue
    }
    hasNumberToken = true
    tokens.push(...createTokens(numberFormatTokens, segment.text))
  }

  return hasNumberToken ? {type: FormatExpressionType.NUMBER, tokens} : undefined
}

export function parse(str: string): FormatExpression {
  return parseForDateTimeFormat(str) ?? parseForNumberFormat(str) ?? {
    type: FormatExpressionType.STRING,
    tokens: [{
      type: TokenType.FREE_TEXT,
      value: str,
    }],
  }
}

export function isEscapeToken(token: RegExpExecArray): boolean {
  return token[0].startsWith('\\')
}
