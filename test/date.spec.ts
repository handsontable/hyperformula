
import {Config} from '../src'
import {dateNumberToMonthNumber, dateToNumber, DateHelper} from '../src/Date'

describe('Date helpers', () => {
  it('#dateToNumber should return number representation of a date', () => {
    expect(dateToNumber({year: 1900, month: 1, day: 1}, new Config())).toBe(2)
    expect(dateToNumber({year: 1899, month: 12, day: 30}, new Config())).toBe(0)
    expect(dateToNumber({year: 1900, month: 12, day: 31}, new Config())).toBe(366)
    expect(dateToNumber({year: 2018, month: 12, day: 31}, new Config())).toBe(43465)
  })
  it('#dateToNumber should return number representation of a date, excel compatibility', () => {
    expect(dateToNumber({year: 1900, month: 1, day: 1}, new Config({leapYear1900: true}))).toBe(2)
    expect(dateToNumber({year: 1899, month: 12, day: 30}, new Config({leapYear1900: true}))).toBe(0)
    expect(dateToNumber({year: 1900, month: 12, day: 31}, new Config({leapYear1900: true}))).toBe(367)
    expect(dateToNumber({year: 2018, month: 12, day: 31}, new Config({leapYear1900: true}))).toBe(43466)
  })

  it('#dateNumberToMonthNumber should return proper month number', () => {
    expect(dateNumberToMonthNumber(0, new Config())).toEqual(12)
    expect(dateNumberToMonthNumber(2, new Config())).toEqual(1)
    expect(dateNumberToMonthNumber(43465, new Config())).toEqual(12)
  })

  it('#stringToDateNumber - tests expected to return not null', () => {
    const dateHelper = new DateHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('08/16/1985')).toBe(31275)
    expect(dateHelper.dateStringToDateNumber('01/15/2020')).toBe(43845)
    expect(dateHelper.dateStringToDateNumber('02/29/2000')).toBe(36585)
    expect(dateHelper.dateStringToDateNumber('12/31/2999')).toBe(401768)
  })

  it('#stringToDateNumber - excel compatibility', () => {
    const dateHelper = new DateHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('02/29/1900')).toBe(null)
    const dateHelper2 = new DateHelper(new Config({leapYear1900: true}))
    expect(dateHelper2.dateStringToDateNumber('02/29/1900')).toBe(61)
  })

  it('stringToDateNumber - 00 year parsing', () => {
    const dateHelper = new DateHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('08/16/85')).toBe(31275)
    expect(dateHelper.dateStringToDateNumber('01/15/20')).toBe(43845)
    expect(dateHelper.dateStringToDateNumber('02/29/00')).toBe(36585)
    expect(dateHelper.dateStringToDateNumber('12/31/99')).toBe(36525)
    const dateHelper1 = new DateHelper(new Config({nullYear: 0}))
    expect(dateHelper1.dateStringToDateNumber('01/15/20')).toBe(7320)
    const dateHelper2 = new DateHelper(new Config({nullYear: 100}))
    expect(dateHelper2.dateStringToDateNumber('12/31/99')).toBe(73050)
  })

  it('stringToDateNumber - other formats', () => {
    const dateHelper = new DateHelper(new Config({dateFormats : ['MM/DD/YYYY']}))
    expect(dateHelper.dateStringToDateNumber('12/31/99')).toBe(null)
    const dateHelper1 = new DateHelper(new Config({dateFormats : ['YY/MM/DD']}))
    expect(dateHelper1.dateStringToDateNumber('99/12/31')).toBe(36525)
    const dateHelper2 = new DateHelper(new Config({dateFormats : ['MM/DD/YY', 'YY/MM/DD']}))
    expect(dateHelper2.dateStringToDateNumber('99/12/31')).toBe(36525)
  })

  it('#stringToDateNumber - tests expected to return null', () => {
    const dateHelper = new DateHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('1/1/10000')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('5/29/1453')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('www')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('0')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('0/0/1999')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('13/13/2020')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('w8')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('www1')).toBe(null)
    expect(dateHelper.dateStringToDateNumber('10/2020')).toBe(null)
  })
})

describe('Date helpers, other zero date', () => {
  it('#dateToNumber should return number representation of a date, different zero date', () => {
    const config = new Config({nullDate: {year: 1950, month: 6, day: 15}})
    expect(dateToNumber({year: 1900, month: 1, day: 1}, config)).toBe(-18427)
    expect(dateToNumber({year: 1899, month: 12, day: 30}, config)).toBe(-18429)
    expect(dateToNumber({year: 1900, month: 12, day: 31}, config)).toBe(-18063)
    expect(dateToNumber({year: 2018, month: 12, day: 31}, config)).toBe(25036)
  })

  it('#dateNumberToMonthNumber should return proper month number, different zero date', () => {
    const config = new Config({nullDate: {year: 1950, month: 6, day: 15}})
    expect(dateNumberToMonthNumber(0, config)).toEqual(6)
    expect(dateNumberToMonthNumber(2, config)).toEqual(6)
    expect(dateNumberToMonthNumber(43465, config)).toEqual(6)
  })

  it('#stringToDateNumber - tests expected to return not null, different zero date', () => {
    const dateHelper = new DateHelper(new Config({nullDate: {year: 1950, month: 6, day: 15}}))
    expect(dateHelper.dateStringToDateNumber('08/16/1985')).toBe(12846)
    expect(dateHelper.dateStringToDateNumber('01/15/2020')).toBe(25416)
    expect(dateHelper.dateStringToDateNumber('02/29/2000')).toBe(18156)
    expect(dateHelper.dateStringToDateNumber('12/31/2999')).toBe(383339)
  })
})
