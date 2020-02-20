const dateFormatRegex = /(\\.|dddd|ddd|dd|d|DDDD|DDD|DD|D|mmmmm|mmmm|mmm|mm|m|MMMMM|MMMM|MMM|MM|M|YYYY|YY|yyyy|yy|HH|H|hh|h|ss|AM\/PM)/g
const numberFormatRegex = /(\\.|[#0]+(\.[#0]*)?)/g

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
  const numberFormatToken = numberFormatRegex.exec(str)

  if (numberFormatToken !== null) {
    return [numberFormatToken]
  } else {
    return []
  }
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

export function parseForDateFormat(str: string): FormatExpression | null {
  const dateFormatTokens = matchDateFormat(str)

  if (dateFormatTokens.filter((elem) => !isEscapeToken(elem)).length > 0) {
    return {
      type: FormatExpressionType.DATE,
      tokens: createTokens(dateFormatTokens, str),
    }
  } else {
    return null
  }
}

export function parseForNumberFormat(str: string): FormatExpression | null {

  const numberFormatTokens = matchNumberFormat(str)
  if (numberFormatTokens.filter((elem) => !isEscapeToken(elem)).length > 0) {
    return {
      type: FormatExpressionType.NUMBER,
      tokens: createTokens(numberFormatTokens, str),
    }
  } else {
    return null
  }
}

export function parse(str: string): FormatExpression {
  const asDate = parseForDateFormat(str)
  if (asDate !== null) {
    return asDate
  }
  const asNumber = parseForNumberFormat(str)
  if (asNumber !== null) {
    return asNumber
  }

  return {
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
