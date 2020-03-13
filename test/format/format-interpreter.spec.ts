import {buildConfig} from '../../src'
import {DateHelper} from '../../src/DateHelper'
import {format} from '../../src/format/format'

describe('FormatInterpreter', () => {
  const config = buildConfig()
  const dateHelper = new DateHelper(config)
  it('works for expression without significant tokens', () => {
    expect(format(2, 'Foo', config, dateHelper)).toEqual('Foo')
  })

  it('works for simple date expression', () => {
    expect(format(2, 'dd-mm-yyyy', config, dateHelper)).toEqual('01-01-1900')
  })

  it('works with # without decimal separator', () => {
    expect(format(1, '###', config, dateHelper)).toEqual('1')
    expect(format(12, '###', config, dateHelper)).toEqual('12')
    expect(format(123, '###', config, dateHelper)).toEqual('123')
    expect(format(123.4, '###', config, dateHelper)).toEqual('123')
    expect(format(1234, '###', config, dateHelper)).toEqual('1234')
  })

  it('works with # number format with decimal separator', () => {
    expect(format(1, '#.##', config, dateHelper)).toEqual('1.')
    expect(format(12, '#.##', config, dateHelper)).toEqual('12.')
    expect(format(12.34, '#.##', config, dateHelper)).toEqual('12.34')
    expect(format(12.345, '#.##', config, dateHelper)).toEqual('12.35')
  })

  it('works with 0 without decimal separator', () => {
    expect(format(1, '000', config, dateHelper)).toEqual('001')
    expect(format(12, '000', config, dateHelper)).toEqual('012')
    expect(format(123, '000', config, dateHelper)).toEqual('123')
    expect(format(123.4, '000', config, dateHelper)).toEqual('123')
    expect(format(1234, '000', config, dateHelper)).toEqual('1234')
  })

  it('works with 0 number format', () => {
    expect(format(1, '00.00', config, dateHelper)).toEqual('01.00')
    expect(format(12, '00.00', config, dateHelper)).toEqual('12.00')
    expect(format(12.3, '00.00', config, dateHelper)).toEqual('12.30')
    expect(format(12.34, '00.00', config, dateHelper)).toEqual('12.34')
    expect(format(12.345, '00.00', config, dateHelper)).toEqual('12.35')
  })

  it('number formatting with additional chars', () => {
    expect(format(1, '$0.00', config, dateHelper)).toEqual('$1.00')
  })
})
