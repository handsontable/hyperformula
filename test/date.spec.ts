
import {Config} from '../src'
import {dateNumberToMonthNumber, dateToNumber, dateStringToDateNumber} from '../src/Date'

describe('Date helpers', () => {
  it('#dateToNumber should return number representation of a date', () => {
    expect(dateToNumber({year: 1900, month: 1, day: 1}, new Config())).toBe(2)
    expect(dateToNumber({year: 1899, month: 12, day: 30}, new Config())).toBe(0)
    expect(dateToNumber({year: 1900, month: 12, day: 31}, new Config())).toBe(366)
    expect(dateToNumber({year: 2018, month: 12, day: 31}, new Config())).toBe(43465)
  })

  it('#dateNumberToMonthNumber should return proper month number', () => {
    expect(dateNumberToMonthNumber(0, new Config())).toEqual(12)
    expect(dateNumberToMonthNumber(2, new Config())).toEqual(1)
    expect(dateNumberToMonthNumber(43465, new Config())).toEqual(12)
  })

  it('#stringToDateNumber - tests expected to return not null', () => {
    expect(dateStringToDateNumber('08/16/1985', new Config())).toBe(31275)
    expect(dateStringToDateNumber('01/15/2020', new Config())).toBe(43845)
    expect(dateStringToDateNumber('02/29/2000', new Config())).toBe(36585)
    expect(dateStringToDateNumber('12/31/2999', new Config())).toBe(401768)
  })

  it('stringToDateNumber - 00 year parsing', () => {
    expect(dateStringToDateNumber('08/16/85', new Config())).toBe(31275)
    expect(dateStringToDateNumber('01/15/20', new Config())).toBe(43845)
    expect(dateStringToDateNumber('01/15/20', new Config({nullYear: 0}))).toBe(7320)
    expect(dateStringToDateNumber('02/29/00', new Config())).toBe(36585)
    expect(dateStringToDateNumber('12/31/99', new Config())).toBe(36525)
    expect(dateStringToDateNumber('12/31/99', new Config({nullYear: 100}))).toBe(73050)
  })

  it('stringToDateNumber - other formats', () => {
    expect(dateStringToDateNumber('12/31/99', new Config({dateFormats : ['MM/DD/YYYY']}))).toBe(null)
    expect(dateStringToDateNumber('99/12/31', new Config({dateFormats : ['YY/MM/DD']}))).toBe(36525)
    expect(dateStringToDateNumber('99/12/31', new Config({dateFormats : ['MM/DD/YY', 'YY/MM/DD']}))).toBe(36525)
  })

  it('#stringToDateNumber - tests expected to return null', () => {
    expect(dateStringToDateNumber('1/1/10000', new Config())).toBe(null)
    expect(dateStringToDateNumber('5/29/1453', new Config())).toBe(null)
    expect(dateStringToDateNumber('www', new Config())).toBe(null)
    expect(dateStringToDateNumber('0', new Config())).toBe(null)
    expect(dateStringToDateNumber('0/0/1999', new Config())).toBe(null)
    expect(dateStringToDateNumber('13/13/2020', new Config())).toBe(null)
    expect(dateStringToDateNumber('', new Config())).toBe(null)
    expect(dateStringToDateNumber('w8', new Config())).toBe(null)
    expect(dateStringToDateNumber('www1', new Config())).toBe(null)
    expect(dateStringToDateNumber('10/2020', new Config())).toBe(null)
  })
})

describe('Date helpers, other zero date', () => {
  it('#dateToNumber should return number representation of a date, different zero date', () => {
    const config = new Config({zeroDate: {year: 1950, month: 6, day: 15}})
    expect(dateToNumber({year: 1900, month: 1, day: 1}, config)).toBe(-18427)
    expect(dateToNumber({year: 1899, month: 12, day: 30}, config)).toBe(-18429)
    expect(dateToNumber({year: 1900, month: 12, day: 31}, config)).toBe(-18063)
    expect(dateToNumber({year: 2018, month: 12, day: 31}, config)).toBe(25036)
  })

  it('#dateNumberToMonthNumber should return proper month number, different zero date', () => {
    const config = new Config({zeroDate: {year: 1950, month: 6, day: 15}})
    expect(dateNumberToMonthNumber(0, config)).toEqual(6)
    expect(dateNumberToMonthNumber(2, config)).toEqual(6)
    expect(dateNumberToMonthNumber(43465, config)).toEqual(6)
  })

  it('#stringToDateNumber - tests expected to return not null, different zero date', () => {
    const config = new Config({zeroDate: {year: 1950, month: 6, day: 15}})
    expect(dateStringToDateNumber('08/16/1985', config)).toBe(12846)
    expect(dateStringToDateNumber('01/15/2020', config)).toBe(25416)
    expect(dateStringToDateNumber('02/29/2000', config)).toBe(18156)
    expect(dateStringToDateNumber('12/31/2999', config)).toBe(383339)
  })
})
