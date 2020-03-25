import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {SimpleDate} from '../../src/DateTime'
import {defaultStringifyDate} from '../../src/format/format'
import {Maybe} from '../../src/Maybe'
import {adr, detailedError} from '../testUtils'

describe('Text', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '2',
      '=TEXT(A1, "mm/dd/yyyy")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('01/01/1900')
  })

  it('wrong number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TEXT(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('wrong format argument',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TEXT(2, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong date argument',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TEXT(TRUE(), "mm/dd/yyyy")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('12/31/1899')
  })

  it('day formats',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "d d")',
      '=TEXT(A1, "dd DD")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('8 8')
    expect(engine.getCellValue(adr('C1'))).toEqual('08 08')
  })

  xit('day formats - not supported',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "ddd DDD")',
      '=TEXT(A1, "dddd DDDD")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('Wed Wed')
    expect(engine.getCellValue(adr('C1'))).toEqual('Wednesday Wednesday')
  })

  it('month formats',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "m M")',
      '=TEXT(A1, "mm MM")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('8 8')
    expect(engine.getCellValue(adr('C1'))).toEqual('08 08')
  })

  xit('month formats - not supported',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "mmm MMM")',
      '=TEXT(A1, "mmmm MMMM")',
      '=TEXT(A1, "mmmmm MMMMM")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('Aug Aug')
    expect(engine.getCellValue(adr('C1'))).toEqual('August August')
    expect(engine.getCellValue(adr('D1'))).toEqual('A A')
  })

  it('year formats',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "yy YY")',
      '=TEXT(A1, "yyyy YYYY")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('18 18')
    expect(engine.getCellValue(adr('C1'))).toEqual('2018 2018')
  })

  xit('12 hours - not supported',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "hh:mm AM/PM")',
    ]])
    expect(engine.getCellValue(adr('B1'))).toEqual('12:00 AM')
  })

  xit('24 hours - not supported',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "HH:mm")',
    ]])
    expect(engine.getCellValue(adr('B1'))).toEqual('00:00')
  })

  xit('distinguishes between months and minutes - not supported',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "mm")',
      '=TEXT(A1, "HH:mm")',
      '=TEXT(A1, "H:m")',
      '=TEXT(A1, "h:M")',
    ]])
    expect(engine.getCellValue(adr('B1'))).toEqual('08')
    expect(engine.getCellValue(adr('C1'))).toEqual('00:00')
    expect(engine.getCellValue(adr('D1'))).toEqual('0:0')
    expect(engine.getCellValue(adr('E1'))).toEqual('12:0')
  })

  it('works for number format',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '12.45',
      '=TEXT(A1, "###.###")',
      '=TEXT(A1, "000.000")',
    ]])

    expect(engine.getCellValue(adr('B1'))).toEqual('12.45')
    expect(engine.getCellValue(adr('C1'))).toEqual('012.450')
  })

})

describe( 'Custom date printing', () => {
  function customPrintDate(date: SimpleDate, dateFormat: string): Maybe<string> {
    const str = defaultStringifyDate(date, dateFormat)
    if(str === undefined) {
      return undefined
    } else {
      return 'fancy ' + str + ' fancy'
    }
  }
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '2',
      '=TEXT(A1, "mm/dd/yyyy")',
    ]], {stringifyDate: customPrintDate})

    expect(engine.getCellValue(adr('B1'))).toEqual('fancy 01/01/1900 fancy')
  })

  it('no effect for number format',  () => {
    const engine =  HyperFormula.buildFromArray([[
      '12.45',
      '=TEXT(A1, "###.###")',
      '=TEXT(A1, "000.000")',
    ]], {stringifyDate: customPrintDate})

    expect(engine.getCellValue(adr('B1'))).toEqual('12.45')
    expect(engine.getCellValue(adr('C1'))).toEqual('012.450')
  })
})
