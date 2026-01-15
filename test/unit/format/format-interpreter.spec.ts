import {Config} from '../../../src/Config'
import {DateTimeHelper} from '../../../src/DateTimeHelper'
import {format} from '../../../src/format/format'

describe('FormatInterpreter', () => {
  const config = new Config()
  const dateHelper = new DateTimeHelper(config)
  it('works for expression without significant tokens', () => {
    expect(format(2, 'Foo', config, dateHelper)).toBe('Foo')
  })

  it('works for simple date expression', () => {
    expect(format(2, 'dd-mm-yyyy', config, dateHelper)).toBe('01-01-1900')
  })

  it('works with # without decimal separator', () => {
    expect(format(1, '###', config, dateHelper)).toBe('1')
    expect(format(12, '###', config, dateHelper)).toBe('12')
    expect(format(123, '###', config, dateHelper)).toBe('123')
    expect(format(123.4, '###', config, dateHelper)).toBe('123')
    expect(format(1234, '###', config, dateHelper)).toBe('1234')
  })

  it('works with # number format with decimal separator', () => {
    expect(format(1, '#.##', config, dateHelper)).toBe('1.')
    expect(format(12, '#.##', config, dateHelper)).toBe('12.')
    expect(format(12.34, '#.##', config, dateHelper)).toBe('12.34')
    expect(format(12.345, '#.##', config, dateHelper)).toBe('12.35')
  })

  it('works with 0 without decimal separator', () => {
    expect(format(1, '000', config, dateHelper)).toBe('001')
    expect(format(12, '000', config, dateHelper)).toBe('012')
    expect(format(123, '000', config, dateHelper)).toBe('123')
    expect(format(123.4, '000', config, dateHelper)).toBe('123')
    expect(format(1234, '000', config, dateHelper)).toBe('1234')
  })

  it('works with 0 number format', () => {
    expect(format(1, '00.00', config, dateHelper)).toBe('01.00')
    expect(format(12, '00.00', config, dateHelper)).toBe('12.00')
    expect(format(12.3, '00.00', config, dateHelper)).toBe('12.30')
    expect(format(12.34, '00.00', config, dateHelper)).toBe('12.34')
    expect(format(12.345, '00.00', config, dateHelper)).toBe('12.35')
  })

  it('number formatting with additional chars', () => {
    expect(format(1, '$0.00', config, dateHelper)).toBe('$1.00')
  })
})
