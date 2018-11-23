import { dateNumberToMonthNumber, dateNumberToString, toDateNumber } from '../src/Date'

describe('Date helpers', () => {
  it('#toDateNumber should return number representation of a date', () => {
    expect(toDateNumber(1900, 1, 1)).toBe(2)
    expect(toDateNumber(1899, 12, 30)).toBe(0)
    expect(toDateNumber(1900, 12, 31)).toBe(366)
    expect(toDateNumber(2018, 12, 31)).toBe(43465)
  })

  it ('#dateNumberToString should return properly formatted  date', () => {
    expect(dateNumberToString(0)).toEqual('1899-12-30')
    expect(dateNumberToString(2)).toEqual('1900-01-01')
    expect(dateNumberToString(43465)).toEqual('2018-12-31')
  })

  it('#dateNumberToMonthNumber should return proper month number', () => {
    expect(dateNumberToMonthNumber(0)).toEqual(12)
    expect(dateNumberToMonthNumber(2)).toEqual(1)
    expect(dateNumberToMonthNumber(43465)).toEqual(12)
  })
})
