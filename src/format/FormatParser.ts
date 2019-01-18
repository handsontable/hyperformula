const dateFormatRegex = /(?<!\\)(dddd|ddd|dd|d|DDDD|DDD|DD|D|mmmmm|mmmm|mmm|mm|m|MMMMM|MMMM|MMM|MM|M|YYYY|YY|yyyy|yy|HH|hh|ss|AM\/PM)/g
const numberFormatRegex = /(?<!\\)([#0]+(\.[#0]*)?)/g


export enum TokenType {
  FORMAT = 'FORMAT',
  FREE_TEXT = 'FREE_TEXT',
}

export interface FormatToken {
  type: TokenType,
  value: string
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
  tokens: FormatToken[]
}

function matchDateFormat(str: string): RegExpExecArray[] {
  const tokens: RegExpExecArray[] = []

  let m

  do {
    m = dateFormatRegex.exec(str)
    if (m != null) {
      tokens.push(m)
    }
  } while (m)

  return tokens
}

function matchNumberFormat(str: string): RegExpExecArray[] {
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
    tokens.push(formatToken(TokenType.FORMAT, token[0]))

    start = token.index + token[0].length
  }

  const lastToken = regexTokens[regexTokens.length - 1] as RegExpExecArray

  if (lastToken.index + lastToken[0].length < str.length) {
    const afterLastToken = str.substr(lastToken.index + lastToken[0].length, str.length)
    tokens.push(formatToken(TokenType.FREE_TEXT, afterLastToken))
  }

  return tokens
}

export function parse(str: string): FormatExpression {
  const dateFormatTokens = matchDateFormat(str)

  if (dateFormatTokens.length > 0) {
    return {
      type: FormatExpressionType.DATE,
      tokens: createTokens(dateFormatTokens, str),
    }
  }

  const numberFormatTokens = matchNumberFormat(str)
  if (numberFormatTokens.length > 0) {
    return {
      type: FormatExpressionType.NUMBER,
      tokens: createTokens(numberFormatTokens, str),
    }
  }

  return {
    type: FormatExpressionType.STRING,
    tokens: [{
      type: TokenType.FREE_TEXT,
      value: str,
    }],
  }
}
