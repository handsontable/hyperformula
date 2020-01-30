
import {Config} from '../src'
import {dateNumberToMonthNumber, toDateNumber, dateStringToDateNumber} from '../src/Date'

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
    expect(dateStringToDateNumber('08/16/1985', new Config())).toBe(31275)
    expect(dateStringToDateNumber('01/15/2020', new Config())).toBe(43845)
    expect(dateStringToDateNumber('02/29/2000', new Config())).toBe(36585)
    expect(dateStringToDateNumber('12/31/2999', new Config())).toBe(401768)
  })

  it('#stringToDateNumber - tests expected to return null', () => {
    expect(dateStringToDateNumber('1/1/1', new Config())).toBe(null)
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
