import {HyperFormula} from '../../src'
import {ErrorType} from '../../src'
import {SimpleDateTime} from '../../src/DateTimeHelper'
import {ErrorMessage} from '../../src/error-message'
import {defaultStringifyDateTime} from '../../src/format/format'
import {Maybe} from '../../src/Maybe'
import {adr, detailedError} from '../testUtils'

describe('TEXT()', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([[
      '2',
      '=TEXT(A1, "mm/dd/yyyy")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('01/01/1900')
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TEXT(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('wrong format argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TEXT(2, 42)'],
      ['=TEXT(2, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('42')
    expect(engine.getCellValue(adr('A2'))).toEqual('2')
  })

  it('wrong date argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TEXT(TRUE(), "mm/dd/yyyy")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('12/31/1899')
  })

  it('day formats', () => {
    const engine = HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "d d")',
      '=TEXT(A1, "dd DD")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('8 8')
    expect(engine.getCellValue(adr('C1'))).toEqual('08 08')
  })

  it('month formats', () => {
    const engine = HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "m M")',
      '=TEXT(A1, "mm MM")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('8 0') //heuristic - repeated month is minutes
    expect(engine.getCellValue(adr('C1'))).toEqual('08 00') //heuristic - repeated month is minutes
  })

  it('year formats', () => {
    const engine = HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "yy YY")',
      '=TEXT(A1, "yyyy YYYY")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('18 18')
    expect(engine.getCellValue(adr('C1'))).toEqual('2018 2018')
  })

  it('12 hours', () => {
    const engine = HyperFormula.buildFromArray([
      [
        '8/8/2018 14:00',
        '=TEXT(A1, "hh:mm A/P")',
      ],
      [
        '8/8/2018 00:30',
        '=TEXT(A2, "hh:mm AM/PM")',
      ],
      ['8/8/2018 00:30', '=TEXT(A3, "hh:mm am/pm")'],
      [
        '8/8/2018 00:30',
        '=TEXT(A4, "hh:mm a/p")',
      ]
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('02:00 P')
    expect(engine.getCellValue(adr('B2'))).toEqual('12:30 AM')
    expect(engine.getCellValue(adr('B3'))).toEqual('12:30 am')
    expect(engine.getCellValue(adr('B4'))).toEqual('12:30 a')
  })

  it('24 hours', () => {
    const engine = HyperFormula.buildFromArray([
      [
        '8/8/2018 13:59',
        '=TEXT(A1, "HH:mm")',
      ]
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('13:59')
  })

  it('padding', () => {
    const engine = HyperFormula.buildFromArray([
      [
        '8/8/2018 01:01:01', '=TEXT(A1, "H:m:s")',
      ],
      [
        '8/8/2018 01:11:11', '=TEXT(A2, "H:m:s")',
      ]
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('1:1:1')
    expect(engine.getCellValue(adr('B2'))).toEqual('1:11:11')
  })

  it('fractions of seconds', () => {
    const engine = HyperFormula.buildFromArray([
      [
        '0.0000011574074074074074', '=TEXT(A1, "hh:mm:ss.ss")',
      ],
      ['0.000001', '=TEXT(A2, "hh:mm:ss.sss")']
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('00:00:00.1')
    expect(engine.getCellValue(adr('B2'))).toEqual('00:00:00.086')
  })

  it('distinguishes between months and minutes - not supported', () => {
    const engine = HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "mm")',
      '=TEXT(A1, "HH:mm")',
      '=TEXT(A1, "H:m")',
    ]])
    expect(engine.getCellValue(adr('B1'))).toEqual('08')
    expect(engine.getCellValue(adr('C1'))).toEqual('00:00')
    expect(engine.getCellValue(adr('D1'))).toEqual('0:0')
  })

  it('works for number format', () => {
    const engine = HyperFormula.buildFromArray([
      ['12.45'],
      ['=TEXT(A1, "###.###")'],
      ['=TEXT(A1, "000.000")'],
      ['=TEXT(A1, "$000.00")'],
      ['=TEXT(A1, "$#.000")'],
      ['=TEXT(A1, "$###.000")'],
      ['=TEXT(A1, "000.00.00$")'],
      ['=TEXT(A1, "###.##.##$")'],
      ['=TEXT(A1, "$###,##0.00")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('12.45')
    expect(engine.getCellValue(adr('A3'))).toEqual('012.450')
    expect(engine.getCellValue(adr('A4'))).toEqual('$012.45')
    expect(engine.getCellValue(adr('A5'))).toEqual('$12.450')
    expect(engine.getCellValue(adr('A6'))).toEqual('$12.450')
    expect(engine.getCellValue(adr('A7'))).toEqual('012.45.00$')
    expect(engine.getCellValue(adr('A8'))).toEqual('12.45.##$')
    expect(engine.getCellValue(adr('A9'))).toEqual('$12,##0.00')
  })

  it('works with currency format "$#.00"', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TEXT(0.5, "$#.00")'],
      ['=TEXT(10, "$#.00")'],
      ['=TEXT(100, "$#.00")'],
      ['=TEXT(1000, "$#.00")'],
      ['=TEXT(10000, "$#.00")'],
      ['=TEXT(100000, "$#.00")'],
      ['=TEXT(1000000, "$#.00")'],
      ['=TEXT(10000000, "$#.00")'],
      ['=TEXT(10000000.99, "$#.00")'],
      ['=TEXT(10000000.99999, "$#.00")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('$0.50')
    expect(engine.getCellValue(adr('A2'))).toEqual('$10.00')
    expect(engine.getCellValue(adr('A3'))).toEqual('$100.00')
    expect(engine.getCellValue(adr('A4'))).toEqual('$1000.00')
    expect(engine.getCellValue(adr('A5'))).toEqual('$10000.00')
    expect(engine.getCellValue(adr('A6'))).toEqual('$100000.00')
    expect(engine.getCellValue(adr('A7'))).toEqual('$1000000.00')
    expect(engine.getCellValue(adr('A8'))).toEqual('$10000000.00')
    expect(engine.getCellValue(adr('A9'))).toEqual('$10000000.99')
    expect(engine.getCellValue(adr('A10'))).toEqual('$10000001.00')
  })

  it('date and time format', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.100', '=TEXT(A1, "yyyy-mm-dd hh:mm:ss")'],
      ['1.222', '=TEXT(A2, "yyyy-mm-dd hh:mm:ss")'],
      ['0.99999', '=TEXT(A3, "yyyy-mm-dd hh:mm:ss")'],
      ['0.999999', '=TEXT(A4, "yyyy-mm-dd hh:mm:ss")'],
      ['0.9999999', '=TEXT(A5, "yyyy-mm-dd hh:mm:ss")'],
      ['0.99999999', '=TEXT(A6, "yyyy-mm-dd hh:mm:ss")'],
      ['0.999999999', '=TEXT(A7, "yyyy-mm-dd hh:mm:ss")'],
      ['0.9999999999', '=TEXT(A8, "yyyy-mm-dd hh:mm:ss")'],
      ['0.99999999999', '=TEXT(A9, "yyyy-mm-dd hh:mm:ss")'],
      ['0.999999999999', '=TEXT(A10, "yyyy-mm-dd hh:mm:ss")']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('1899-12-31 02:24:00')
    expect(engine.getCellValue(adr('B2'))).toEqual('1899-12-31 05:19:40')
    expect(engine.getCellValue(adr('B3'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B4'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B5'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B6'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B7'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B8'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B9'))).toEqual('1899-12-31 00:00:00')
    expect(engine.getCellValue(adr('B10'))).toEqual('1899-12-31 00:00:00')
  })

  it('correct rounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.9999999999', '=TEXT(A1, "yyyy-mm-dd hh:mm:ss.sssss")'],
      ['0.9999999999', '=TEXT(A2, "yyyy-mm-dd hh:mm:ss.ssss")'],
      ['0.9999999999', '=TEXT(A3, "yyyy-mm-dd hh:mm:ss.sss")'],
      ['0.9999999999', '=TEXT(A4, "yyyy-mm-dd hh:mm:ss.ss")'],
      ['0.9999999999', '=TEXT(A5, "yyyy-mm-dd hh:mm:ss.s")'],
      ['0.9999999999', '=TEXT(A6, "yyyy-mm-dd hh:mm:ss")'],
      ['0.9999999999', '=TEXT(A7, "yyyy-mm-dd hh:mm")'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('1899-12-30 23:59:59.99999')
    expect(engine.getCellValue(adr('B2'))).toEqual('1899-12-30 23:59:59.9999')
    expect(engine.getCellValue(adr('B3'))).toEqual('1899-12-30 23:59:59.999')
    expect(engine.getCellValue(adr('B4'))).toEqual('1899-12-30 23:59:59.99')
    expect(engine.getCellValue(adr('B5'))).toEqual('1899-12-30 23:59:59.9')
    expect(engine.getCellValue(adr('B6'))).toEqual('1899-12-30 23:59:59')
    expect(engine.getCellValue(adr('B7'))).toEqual('1899-12-30 23:59')
  })
})

describe('time duration', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.1', '=TEXT(A1, "[hh]:mm:ss")'],
      ['1.1', '=TEXT(A2, "[hh]:mm:ss")', ],
      ['0.1', '=TEXT(A3, "[mm]:ss")', ],
      ['1.1', '=TEXT(A4, "[mm]:ss")', ],
      ['1.1', '=TEXT(A5, "[hh]:m:ss")', ],
      ['0.1111', '=TEXT(A6, "[mm]:ss.ss")', ],
      ['0.1111', '=TEXT(A7, "[mm]:ss.00")', ],
      ['0.1111', '=TEXT(A8, "hh:[mm]:s")', ],
      ['0.1111', '=TEXT(A9, "h:[mm]")', ],
      ['0.1111', '=TEXT(A10, "abc")', ],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('02:24:00')
    expect(engine.getCellValue(adr('B2'))).toEqual('26:24:00')
    expect(engine.getCellValue(adr('B3'))).toEqual('144:00')
    expect(engine.getCellValue(adr('B4'))).toEqual('1584:00')
    expect(engine.getCellValue(adr('B5'))).toEqual('26:24:00')
    expect(engine.getCellValue(adr('B6'))).toEqual('159:59.04')
    expect(engine.getCellValue(adr('B7'))).toEqual('159:59.04')
    expect(engine.getCellValue(adr('B8'))).toEqual('02:39:59')
    expect(engine.getCellValue(adr('B9'))).toEqual('2:39')
    expect(engine.getCellValue(adr('B10'))).toEqual('abc')
  })
})

describe('Custom date printing', () => {
  function customPrintDate(date: SimpleDateTime, dateFormat: string): Maybe<string> {
    const str = defaultStringifyDateTime(date, dateFormat)
    if (str === undefined) {
      return undefined
    } else {
      return 'fancy ' + str + ' fancy'
    }
  }

  it('works', () => {
    const engine = HyperFormula.buildFromArray([[
      '2',
      '=TEXT(A1, "mm/dd/yyyy")',
    ]], {stringifyDateTime: customPrintDate})

    expect(engine.getCellValue(adr('B1'))).toEqual('fancy 01/01/1900 fancy')
  })

  it('no effect for number format', () => {
    const engine = HyperFormula.buildFromArray([[
      '12.45',
      '=TEXT(A1, "###.###")',
      '=TEXT(A1, "000.000")',
    ]], {stringifyDateTime: customPrintDate})

    expect(engine.getCellValue(adr('B1'))).toEqual('12.45')
    expect(engine.getCellValue(adr('C1'))).toEqual('012.450')
  })

  it('date printing, month and minutes', () => {
    const engine = HyperFormula.buildFromArray([['1.1', '=TEXT(A1, "mm-dd mm:ss.sssss")'],
      ['1.222', '=TEXT(A2, "mm-dd mm:ss.sssss")']])
    expect(engine.getCellValue(adr('B1'))).toEqual('12-31 24:00')
    expect(engine.getCellValue(adr('B2'))).toEqual('12-31 19:40.79999')
  })
})
