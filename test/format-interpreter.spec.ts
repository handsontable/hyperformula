import {format} from '../src/format/Format'
import {FormatExpression, FormatExpressionType, formatToken, TokenType} from '../src/format/FormatParser'

describe('FormatInterpreter', () => {
  it('works for expression without significant tokens', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.STRING,
      tokens: [
        formatToken(TokenType.FREE_TEXT, 'Foo'),
      ],
    }

    expect(format(exp, 2)).toEqual('Foo')
  })

  it('works for simple date expression', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.DATE,
      tokens: [
        formatToken(TokenType.FORMAT, 'dd'),
        formatToken(TokenType.FREE_TEXT, '-'),
        formatToken(TokenType.FORMAT, 'mm'),
        formatToken(TokenType.FREE_TEXT, '-'),
        formatToken(TokenType.FORMAT, 'yyyy'),
      ],
    }

    expect(format(exp, 2)).toEqual('01-01-1900')
  })

  it('throws Error when mismatched token type', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.DATE,
      tokens: [
        formatToken(TokenType.FORMAT, 'Foo'),
      ],
    }

    expect(() => format(exp, 2)).toThrow(new Error('Mismatched token type'))
  })

  it('works with # without decimal separator', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.NUMBER,
      tokens: [
        formatToken(TokenType.FORMAT, '###')
      ]
    }

    expect(format(exp, 1)).toEqual("1")
    expect(format(exp, 12)).toEqual("12")
    expect(format(exp, 123)).toEqual("123")
    expect(format(exp, 123.4)).toEqual("123")
  })

  it('works with # number format with decimal separator', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.NUMBER,
      tokens: [
          formatToken(TokenType.FORMAT, '#.##')
      ]
    }

    expect(format(exp, 1)).toEqual("1.")
    expect(format(exp, 12)).toEqual("12.")
    expect(format(exp, 12.34)).toEqual("12.34")
    expect(format(exp, 12.345)).toEqual("12.35")
  })

  it('works with 0 without decimal separator', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.NUMBER,
      tokens: [
        formatToken(TokenType.FORMAT, '000')
      ]
    }

    expect(format(exp, 1)).toEqual("001")
    expect(format(exp, 12)).toEqual("012")
    expect(format(exp, 123)).toEqual("123")
    expect(format(exp, 123.4)).toEqual("123")
  })

  it('works with 0 number format', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.NUMBER,
      tokens: [
        formatToken(TokenType.FORMAT, '00.00')
      ]
    }

    expect(format(exp, 1)).toEqual("01.00")
    expect(format(exp, 12)).toEqual("12.00")
    expect(format(exp, 12.3)).toEqual("12.30")
    expect(format(exp, 12.34)).toEqual("12.34")
    expect(format(exp, 12.345)).toEqual("12.35")
  })
})
