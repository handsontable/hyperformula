/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {Maybe} from '../Maybe'

const dateFormatRegex = /(\\.|dd|DD|d|D|mm|MM|m|M|YYYY|YY|yyyy|yy|HH|hh|H|h|ss(\.(0+|s+))?|s|AM\/PM|am\/pm|A\/P|a\/p|\[mm]|\[MM]|\[hh]|\[HH])/g

/**
 * Builds the number-format tokenizer regex for the given separators.
 *
 * A number token starts with a `#`/`0` placeholder, goes on with placeholders and
 * grouping characters, and may end with the decimal separator and more
 * placeholders: `[#0][#0,]*(\.[#0]*)?` for `.` and `,`. A grouping character
 * before the first placeholder is text, as in Excel, where ` 0` gives ` 5` when
 * the grouping character is a space. Whether a grouping character means "group
 * thousands", a trailing scaler, or neither is decided later by string
 * inspection in `format.ts`, never by regex structure.
 *
 * Synchronous catastrophic backtracking is not catchable by jest/jasmine
 * wall-clock timeouts, so this pattern MUST NOT be rewritten into a
 * nested-quantifier form such as `([#0]+,)*[#0]+`.
 *
 * @param decimalSeparator the character that marks the decimal point in a mask
 * @param groupingSeparator the character that marks thousands grouping in a mask, or `''` for none
 * @returns a new global regex that matches backslash escapes and number tokens
 */
export function buildNumberFormatRegex(decimalSeparator: string, groupingSeparator: string): RegExp {
  const decimal = escapeRegExpSpecialCharacters(decimalSeparator)
  const grouping = escapeRegExpSpecialCharacters(groupingSeparator)
  return new RegExp(`(\\\\.|[#0][#0${grouping}]*(${decimal}[#0]*)?)`, 'g')
}

/**
 * Escapes the characters that have a special meaning in a regex.
 *
 * @param text the text to match literally
 * @returns the text with each special character escaped
 */
function escapeRegExpSpecialCharacters(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const numberFormatRegexCache = new Map<string, RegExp>()

/**
 * Returns the number-format tokenizer regex for the given separators, built once
 * per pair of separators.
 *
 * @param decimalSeparator the character that marks the decimal point in a mask
 * @param groupingSeparator the character that marks thousands grouping in a mask, or `''` for none
 * @returns the cached global regex
 */
function numberFormatRegex(decimalSeparator: string, groupingSeparator: string): RegExp {
  const key = decimalSeparator + groupingSeparator
  let regex = numberFormatRegexCache.get(key)
  if (regex === undefined) {
    regex = buildNumberFormatRegex(decimalSeparator, groupingSeparator)
    numberFormatRegexCache.set(key, regex)
  }
  return regex
}

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

function matchNumberFormat(str: string, decimalSeparator: string, groupingSeparator: string): RegExpExecArray[] {
  const regex = numberFormatRegex(decimalSeparator, groupingSeparator)
  regex.lastIndex = 0

  // The first number token is the one the value is written into; escapes before
  // it are text. Only that token is returned, so the rest of the mask is text.
  let match
  while ((match = regex.exec(str)) !== null) {
    if (!isEscapeToken(match)) {
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

/**
 * Tokenizes a number-format mask read with the given separators.
 *
 * @param str the mask, without quotes
 * @param decimalSeparator the character that marks the decimal point in the mask
 * @param groupingSeparator the character that marks thousands grouping in the mask, or `''` for none
 * @returns the tokens, or `undefined` when the mask has no digit placeholder
 */
export function parseForNumberFormat(str: string, decimalSeparator: string, groupingSeparator: string): Maybe<FormatExpression> {
  const numberFormatTokens = matchNumberFormat(str, decimalSeparator, groupingSeparator)
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
  return parseForDateTimeFormat(str) ?? parseForNumberFormat(str, '.', ',') ?? {
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
