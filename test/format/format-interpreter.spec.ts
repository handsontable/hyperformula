import {Config} from '../../src'
import {format} from '../../src/format/format'
import {FormatExpression, FormatExpressionType, formatToken, TokenType} from '../../src/format/parser'

describe('FormatInterpreter', () => {
  it('works for expression without significant tokens', () => {
    expect(format(2, 'Foo', new Config())).toEqual('Foo')
  })

  it('works for simple date expression', () => {
    expect(format(2, 'dd-mm-yyyy', new Config())).toEqual('01-01-1900')
  })

  it('works with # without decimal separator', () => {
    expect(format(1, '###', new Config())).toEqual('1')
    expect(format(12, '###', new Config())).toEqual('12')
    expect(format(123, '###', new Config())).toEqual('123')
    expect(format(123.4, '###', new Config())).toEqual('123')
    expect(format(1234, '###', new Config())).toEqual('1234')
  })

  it('works with # number format with decimal separator', () => {
    expect(format(1, '#.##', new Config())).toEqual('1.')
    expect(format(12, '#.##', new Config())).toEqual('12.')
    expect(format(12.34, '#.##', new Config())).toEqual('12.34')
    expect(format(12.345, '#.##', new Config())).toEqual('12.35')
  })

  it('works with 0 without decimal separator', () => {
    expect(format(1, '000', new Config())).toEqual('001')
    expect(format(12, '000', new Config())).toEqual('012')
    expect(format(123, '000', new Config())).toEqual('123')
    expect(format(123.4, '000', new Config())).toEqual('123')
    expect(format(1234, '000', new Config())).toEqual('1234')
  })

  it('works with 0 number format', () => {
    const exp: FormatExpression = {
      type: FormatExpressionType.NUMBER,
      tokens: [
        formatToken(TokenType.FORMAT, '00.00'),
      ],
    }

    expect(format(1, '00.00', new Config())).toEqual('01.00')
    expect(format(12, '00.00', new Config())).toEqual('12.00')
    expect(format(12.3, '00.00', new Config())).toEqual('12.30')
    expect(format(12.34, '00.00', new Config())).toEqual('12.34')
    expect(format(12.345, '00.00', new Config())).toEqual('12.35')
  })

  it('number formatting with additional chars', () => {
    expect(format(1, '$0.00', new Config())).toEqual('$1.00')
  })
})
