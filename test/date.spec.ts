import {numberDateToString, toNumberDate} from "../src/Date";

describe('Date helpers', () => {
  it('#toNumberDate should return number representation of a date', () => {
    expect(toNumberDate(1900, 1, 1)).toBe(2)
    expect(toNumberDate(1899, 12, 30)).toBe(0)
    expect(toNumberDate(1900, 12, 31)).toBe(366)
    expect(toNumberDate(2018, 12, 31)).toBe(43465)
  })

  it ('#numberDateToString should return properly formatted  date', () => {
    expect(numberDateToString(0)).toEqual("1899-12-30")
    expect(numberDateToString(2)).toEqual("1900-01-01")
    expect(numberDateToString(43465)).toEqual("2018-12-31")
  })
})