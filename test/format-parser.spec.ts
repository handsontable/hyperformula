import {FormatExpressionType, parse, TokenType} from '../src/FormatParser'

describe('FormatParser', () => {
  it('It works for date format', () => {
    const parseResult = parse('dd-mm-yyyy')

    expect(parseResult.type).toBe(FormatExpressionType.DATE)
  })

  it('It works for number format', () => {
    const parseResult = parse('#.###')

    expect(parseResult.type).toBe(FormatExpressionType.NUMBER)
  })

  it('It works without any formatting tokens', () => {
    const parseResult = parse('foo')

    expect(parseResult.type).toBe(FormatExpressionType.STRING)
    expect(parseResult.tokens[0]).toEqual({
      type: TokenType.FREE_TEXT,
      value: 'foo',
    })
  })
})
