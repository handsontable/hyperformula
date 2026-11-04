import {HyperFormula} from '../src'

describe('leapYear1900', () => {
  const excelDates = {leapYear1900: true, nullDate: {year: 1899, month: 12, day: 31}, licenseKey: 'gpl-v3'}

  it('returns 31 as the day of 31 December of a leap year', () => {
    const hf = HyperFormula.buildFromArray([[]], excelDates)

    expect(hf.calculateFormula('=DAY(DATE(2036, 12, 31))', 0)).toBe(31)

    hf.destroy()
  })

  it('returns 31 as the day of 31 December of a common year', () => {
    const hf = HyperFormula.buildFromArray([[]], excelDates)

    expect(hf.calculateFormula('=DAY(DATE(2069, 12, 31))', 0)).toBe(31)

    hf.destroy()
  })

  it('returns December as the month of 31 December', () => {
    const hf = HyperFormula.buildFromArray([[]], excelDates)

    expect(hf.calculateFormula('=MONTH(DATE(2040, 12, 31))', 0)).toBe(12)

    hf.destroy()
  })

  it('returns 31 December from EOMONTH of 31 December', () => {
    const hf = HyperFormula.buildFromArray([[]], excelDates)

    expect(hf.calculateFormula('=TEXT(EOMONTH(DATE(2036, 12, 31), 0), "yyyy-mm-dd")', 0)).toBe('2036-12-31')

    hf.destroy()
  })

  it('returns 31 as the day of 31 December with the default nullDate', () => {
    const hf = HyperFormula.buildFromArray([[]], {leapYear1900: true, licenseKey: 'gpl-v3'})

    expect(hf.calculateFormula('=DAY(DATE(2036, 12, 31))', 0)).toBe(31)

    hf.destroy()
  })

  it('keeps 29 February 1900 as serial 60', () => {
    const hf = HyperFormula.buildFromArray([[]], excelDates)

    expect(hf.calculateFormula('=DAY(60)', 0)).toBe(29)

    hf.destroy()
  })
})
