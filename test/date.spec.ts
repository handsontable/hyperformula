
import {Config} from '../src'
import {dateNumberToMonthNumber, toDateNumber, stringToDateNumber} from '../src/Date'

describe('Date helpers', () => {
  it('#toDateNumber should return number representation of a date', () => {
    expect(toDateNumber(1900, 1, 1)).toBe(2)
    expect(toDateNumber(1899, 12, 30)).toBe(0)
    expect(toDateNumber(1900, 12, 31)).toBe(366)
    expect(toDateNumber(2018, 12, 31)).toBe(43465)
  })

  it('#dateNumberToMonthNumber should return proper month number', () => {
    expect(dateNumberToMonthNumber(0)).toEqual(12)
    expect(dateNumberToMonthNumber(2)).toEqual(1)
    expect(dateNumberToMonthNumber(43465)).toEqual(12)
  })

  it('#stringToDateNumber - tests expected to return not null', () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(stringToDateNumber('08/16/1985', defaultFormat)).toBe(31275)
    expect(stringToDateNumber('01/15/2020', defaultFormat)).toBe(43845)
    expect(stringToDateNumber('02/29/2000', defaultFormat)).toBe(36585)
    expect(stringToDateNumber('12/31/2999', defaultFormat)).toBe(401768)
  })

  it('#stringToDateNumber - tests expected to return null', () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(stringToDateNumber('1/1/1', defaultFormat)).toBe(null)
    expect(stringToDateNumber('5/29/1453', defaultFormat)).toBe(null)
    expect(stringToDateNumber('www', defaultFormat)).toBe(null)
    expect(stringToDateNumber('0', defaultFormat)).toBe(null)
    expect(stringToDateNumber('0/0/1999', defaultFormat)).toBe(null)
    expect(stringToDateNumber('13/13/2020', defaultFormat)).toBe(null)
    expect(stringToDateNumber('', defaultFormat)).toBe(null)
    expect(stringToDateNumber('w8', defaultFormat)).toBe(null)
    expect(stringToDateNumber('www1', defaultFormat)).toBe(null)
    expect(stringToDateNumber('10/2020', defaultFormat)).toBe(null)
  })

})
