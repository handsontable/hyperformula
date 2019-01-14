import {FormatExpressionType, parse, TokenType} from '../src/format/FormatParser'

describe('FormatParser', () => {
  it('works for single date token', () => {
    const parseResult = parse('dd')

    expect(parseResult.type).toBe(FormatExpressionType.DATE)
    expect(parseResult.tokens.length).toBe(1)
    expect(parseResult.tokens[0]).toEqual({
      type: TokenType.FORMAT,
      value: 'dd',
    })
  })

  it('works for date format', () => {
    const parseResult = parse('dd-mm-yyyy')

    expect(parseResult.type).toBe(FormatExpressionType.DATE)
  })

  it('works for number format', () => {
    const parseResult = parse('#.###')

    expect(parseResult.type).toBe(FormatExpressionType.NUMBER)
  })

  it('works for date format and free text', () => {
    const parseResult = parse('dd foo')

    expect(parseResult.type).toBe(FormatExpressionType.DATE)
    expect(parseResult.tokens.length).toBe(2)

    expect(parseResult.tokens[0]).toEqual({
      type: TokenType.FORMAT,
      value: 'dd',
    })

    expect(parseResult.tokens[1]).toEqual({
      type: TokenType.FREE_TEXT,
      value: ' foo',
    })
  })

  it('works without any formatting tokens', () => {
    const parseResult = parse('foo')

    expect(parseResult.type).toBe(FormatExpressionType.STRING)
    expect(parseResult.tokens[0]).toEqual({
      type: TokenType.FREE_TEXT,
      value: 'foo',
    })
  })

  it('matches only one number tokens group', () => {
    const parseResult = parse('#.### #.###')

    expect(parseResult.type).toBe(FormatExpressionType.NUMBER)

    expect(parseResult.tokens[0]).toEqual({
      type: TokenType.FORMAT,
      value: '#.###',
    })

    expect(parseResult.tokens[1]).toEqual({
      type: TokenType.FREE_TEXT,
      value: ' #.###',
    })
  })

})
