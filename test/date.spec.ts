
import {Config} from '../src'
import {dateNumberToMonthNumber, toDateNumber, dateStringToDateNumber} from '../src/Date'

describe('Date helpers', () => {
  it('#toDateNumber should return number representation of a date', () => {
    expect(toDateNumber({year: 1900, month: 1, day: 1}, new Config())).toBe(2)
    expect(toDateNumber({year: 1899, month: 12, day: 30}, new Config())).toBe(0)
    expect(toDateNumber({year: 1900, month: 12, day: 31}, new Config())).toBe(366)
    expect(toDateNumber({year: 2018, month: 12, day: 31}, new Config())).toBe(43465)
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
