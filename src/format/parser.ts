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
 * wall-clock timeouts (see DEV-2120), so this pattern MUST NOT be rewritten
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

export function parseForDateTimeFormat(str: string): Maybe<FormatExpression> {
  const dateFormatTokens = matchDateFormat(str)

  if (dateFormatTokens.every((elem) => isEscapeToken(elem))) {
    return undefined
  } else {
    return {
      type: FormatExpressionType.DATE,
      tokens: createTokens(dateFormatTokens, str),
    }
  }
}

export function parseForNumberFormat(str: string): Maybe<FormatExpression> {
  const numberFormatTokens = matchNumberFormat(str)
  if (numberFormatTokens.every((elem) => isEscapeToken(elem))) {
    return undefined
  } else {
    return {
      type: FormatExpressionType.NUMBER,
      tokens: createTokens(numberFormatTokens, str),
    }
  }
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
