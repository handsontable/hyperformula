import {CellValueDetailedType, HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Date arithmetic', () => {
  it('subtract two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '06/02/2019', '=A1-B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(361)
  })

  it('subtract two dates with custom date format', () => {
    const engine = HyperFormula.buildFromArray([
      ['09/20/2022', '09/25/2022', '=B1-A1'],
    ], { dateFormats: ['MM/DD/YYYY'] })

    expect(engine.getCellValue(adr('C1'))).toBe(5)
  })

  it('compare two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '02/06/2019', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('compare two datestrings', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '="02/06/2019"', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('compare date with datestring, different dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '02/06/2019', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1=B1', '=A1<>B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
    expect(engine.getCellValue(adr('G1'))).toBe(false)
    expect(engine.getCellValue(adr('H1'))).toBe(true)
  })

  it('compare date with datestring, the same dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '02/02/2020', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1=B1', '=A1<>B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(true)
    expect(engine.getCellValue(adr('G1'))).toBe(true)
    expect(engine.getCellValue(adr('H1'))).toBe(false)
  })

  it('compare date with bool', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '=TRUE()', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
    expect(engine.getCellValue(adr('E1'))).toBe(false)
    expect(engine.getCellValue(adr('F1'))).toBe(true)
  })

  it('compare date with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '2', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('sum date with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '2', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(43865)
  })

  it('sum date with boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '=TRUE()', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(43864)
  })

  it('functions on dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISEVEN("02/02/2020")', '=COS("02/02/2020")', '=BITOR("02/02/2020","16/08/1985")'],
    ], {smartRounding: false})

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(0.9965266857693633)
    expect(engine.getCellValue(adr('C1'))).toBe(64383)
  })
})

describe('Time arithmetic', () => {
  it('subtract two time values', () => {
    const engine = HyperFormula.buildFromArray([
      ['13:13', '11:50', '=TEXT(A1-B1, "hh:mm")'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe('01:23')
  })

  it('subtract two time values - rounding test', () => {
    const engine = HyperFormula.buildFromArray([
      ['15:00', '14:00', '=TEXT(A1-B1, "hh:mm")'],
      ['15:01', '14:00', '=TEXT(A2-B2, "hh:mm")'],
      ['15:02', '14:00', '=TEXT(A3-B3, "hh:mm")'],
      ['15:03', '14:00', '=TEXT(A4-B4, "hh:mm")'],
      ['15:04', '14:00', '=TEXT(A5-B5, "hh:mm")'],
      ['15:05', '14:00', '=TEXT(A6-B6, "hh:mm")'],
      ['15:06', '14:00', '=TEXT(A7-B7, "hh:mm")'],
      ['15:07', '14:00', '=TEXT(A8-B8, "hh:mm")'],
      ['15:08', '14:00', '=TEXT(A9-B9, "hh:mm")'],
      ['15:09', '14:00', '=TEXT(A10-B10, "hh:mm")'],
      ['15:10', '14:00', '=TEXT(A11-B11, "hh:mm")'],
      ['15:11', '14:00', '=TEXT(A12-B12, "hh:mm")'],
      ['15:12', '14:00', '=TEXT(A13-B13, "hh:mm")'],
      ['15:13', '14:00', '=TEXT(A14-B14, "hh:mm")'],
      ['15:14', '14:00', '=TEXT(A15-B15, "hh:mm")'],
      ['15:15', '14:00', '=TEXT(A16-B16, "hh:mm")'],
      ['15:16', '14:00', '=TEXT(A17-B17, "hh:mm")'],
      ['15:17', '14:00', '=TEXT(A18-B18, "hh:mm")'],
      ['15:18', '14:00', '=TEXT(A19-B19, "hh:mm")'],
      ['15:19', '14:00', '=TEXT(A20-B20, "hh:mm")'],
      ['15:20', '14:00', '=TEXT(A21-B21, "hh:mm")'],
      ['15:21', '14:00', '=TEXT(A22-B22, "hh:mm")'],
      ['15:22', '14:00', '=TEXT(A23-B23, "hh:mm")'],
      ['15:23', '14:00', '=TEXT(A24-B24, "hh:mm")'],
      ['15:24', '14:00', '=TEXT(A25-B25, "hh:mm")'],
      ['15:25', '14:00', '=TEXT(A26-B26, "hh:mm")'],
      ['15:26', '14:00', '=TEXT(A27-B27, "hh:mm")'],
      ['15:27', '14:00', '=TEXT(A28-B28, "hh:mm")'],
      ['15:28', '14:00', '=TEXT(A29-B29, "hh:mm")'],
      ['15:29', '14:00', '=TEXT(A30-B30, "hh:mm")'],
      ['15:30', '14:00', '=TEXT(A31-B31, "hh:mm")'],
      ['15:31', '14:00', '=TEXT(A32-B32, "hh:mm")'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe('01:00')
    expect(engine.getCellValue(adr('C2'))).toBe('01:01')
    expect(engine.getCellValue(adr('C3'))).toBe('01:02')
    expect(engine.getCellValue(adr('C4'))).toBe('01:03')
    expect(engine.getCellValue(adr('C5'))).toBe('01:04')
    expect(engine.getCellValue(adr('C6'))).toBe('01:05')
    expect(engine.getCellValue(adr('C7'))).toBe('01:06')
    expect(engine.getCellValue(adr('C8'))).toBe('01:07')
    expect(engine.getCellValue(adr('C9'))).toBe('01:08')
    expect(engine.getCellValue(adr('C10'))).toBe('01:09')
    expect(engine.getCellValue(adr('C11'))).toBe('01:10')
    expect(engine.getCellValue(adr('C12'))).toBe('01:11')
    expect(engine.getCellValue(adr('C13'))).toBe('01:12')
    expect(engine.getCellValue(adr('C14'))).toBe('01:13')
    expect(engine.getCellValue(adr('C15'))).toBe('01:14')
    expect(engine.getCellValue(adr('C16'))).toBe('01:15')
    expect(engine.getCellValue(adr('C17'))).toBe('01:16')
    expect(engine.getCellValue(adr('C18'))).toBe('01:17')
    expect(engine.getCellValue(adr('C19'))).toBe('01:18')
    expect(engine.getCellValue(adr('C20'))).toBe('01:19')
    expect(engine.getCellValue(adr('C21'))).toBe('01:20')
    expect(engine.getCellValue(adr('C22'))).toBe('01:21')
    expect(engine.getCellValue(adr('C23'))).toBe('01:22')
    expect(engine.getCellValue(adr('C24'))).toBe('01:23')
    expect(engine.getCellValue(adr('C25'))).toBe('01:24')
    expect(engine.getCellValue(adr('C26'))).toBe('01:25')
    expect(engine.getCellValue(adr('C27'))).toBe('01:26')
    expect(engine.getCellValue(adr('C28'))).toBe('01:27')
    expect(engine.getCellValue(adr('C29'))).toBe('01:28')
    expect(engine.getCellValue(adr('C30'))).toBe('01:29')
    expect(engine.getCellValue(adr('C31'))).toBe('01:30')
    expect(engine.getCellValue(adr('C32'))).toBe('01:31')
  })

  it('compare two time values', () => {
    const engine = HyperFormula.buildFromArray([
      ['13:13', '11:50', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('compare two time-strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['="13:13"', '="11:50"', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('compare a time value with a time-string, non-equal', () => {
    const engine = HyperFormula.buildFromArray([
      ['="13:13"', '11:50', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1=B1', '=A1<>B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
    expect(engine.getCellValue(adr('G1'))).toBe(false)
    expect(engine.getCellValue(adr('H1'))).toBe(true)
  })

  it('compare a time value with a time-string, equal', () => {
    const engine = HyperFormula.buildFromArray([
      ['="13:13"', '13:13', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1=B1', '=A1<>B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(true)
    expect(engine.getCellValue(adr('G1'))).toBe(true)
    expect(engine.getCellValue(adr('H1'))).toBe(false)
  })

  it('compare a time-string with a boolean value', () => {
    const engine = HyperFormula.buildFromArray([
      ['="13:13"', '=TRUE()', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
    expect(engine.getCellValue(adr('E1'))).toBe(false)
    expect(engine.getCellValue(adr('F1'))).toBe(true)
  })

  it('compare a time value with a number', () => {
    const engine = HyperFormula.buildFromArray([
      ['13:13', '0.01', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })

  it('sum a time value with a number', () => {
    const engine = HyperFormula.buildFromArray([
      ['13:13', '2', '=A1+B1', '=TEXT(A1+B1, "hh:mm")'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBeGreaterThan(2)
    expect(engine.getCellValue(adr('D1'))).toBe('13:13')
  })

  it('sum a time value with boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['13:13', '=TRUE()', '=A1+B1', '=TEXT(A1+B1, "hh:mm")'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBeGreaterThan(1)
    expect(engine.getCellValue(adr('D1'))).toBe('13:13')
  })

  it('apply a numeric function to a time value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISODD("13:13")', '=COS("13:13")'],
    ], {smartRounding: false})

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(0.8521613392800845)
  })

  it('Don\'t convert string to time value when prepended with apostrophe', () => {
    const engine = HyperFormula.buildFromArray([
      ["'13:13"],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('13:13')
    expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.STRING)
  })

  it('Don\'t convert string to time value when there is no timeFormats configured', () => {
    const engine = HyperFormula.buildFromArray([
      ['1:80'],
    ], { timeFormats: [] })

    expect(engine.getCellValue(adr('A1'))).toEqual('1:80')
    expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.STRING)
  })
})
