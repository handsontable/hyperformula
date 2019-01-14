import {FormatExpression, FormatExpressionType, formatToken, parse, TokenType} from "../src/format/FormatParser";
import {format} from "../src/format/Format";

describe('FormatInterpreter', () => {
  it('works for expression without significant tokens', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.STRING,
      tokens: [
        formatToken(TokenType.FREE_TEXT, "Foo"),
      ]
    }

    expect(format(exp, 2)).toEqual("Foo")
  })

  it('works for simple date expression', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.DATE,
      tokens: [
        formatToken(TokenType.FORMAT, "dd"),
        formatToken(TokenType.FREE_TEXT, "-"),
        formatToken(TokenType.FORMAT, "mm"),
        formatToken(TokenType.FREE_TEXT, "-"),
        formatToken(TokenType.FORMAT, "yyyy")
      ]
    }

    expect(format(exp, 2)).toEqual("01-01-1900")
  })
})