const dateFormatRegex = /(?<!\\)(dddd|ddd|dd|d|mmmmm|mmmm|mmm|mm|m|yyyy|yy|HH|hh|ss|AM\/PM)/g
const numberFormatRegex = /(?<!\\)([#0]+(\.[#0]*)?)/g

const str = 'mmmm-yyyy-dd-as\\ddddr\\d\\mmm%$    HH hh ss AM/PM'

export enum TokenType {
  FORMAT = 'FORMAT',
  FREE_TEXT = 'FREE_TEXT',
}

interface FormatToken {
  type: TokenType,
  value: string
}

function formatToken(type: TokenType, value: string): FormatToken {
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

interface FormatExpression {
  type: FormatExpressionType,
  tokens: FormatToken[]
}

function formatParse(str: string, regex: RegExp) {
  const tokens: RegExpExecArray[] = []

  let m

  do {
    m = regex.exec(str)
    if (m != null) {
      tokens.push(m)
    }
  } while (m)

  return tokens
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
  const dateFormatTokens = formatParse(str, dateFormatRegex)

  if (dateFormatTokens.length > 0) {
    return {
      type: FormatExpressionType.DATE,
      tokens: createTokens(dateFormatTokens, str),
    }
  }

  const numberFormatTokens = formatParse(str, numberFormatRegex)
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
