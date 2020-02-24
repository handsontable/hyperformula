import {Config, EmptyValue, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, dateNumberToString, detailedError} from '../testUtils'

describe('Function DATE', () => {
  it('with 3 numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 1, 1)', '=DATE(1900, 1, 2)', '=DATE(1915, 10, 24)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('01/01/1900')
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(dateNumberToString(engine.getCellValue(adr('B1')))).toEqual('01/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')))).toEqual('10/24/1915')
  })

  it('truncation', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900.9, 1, 1)', '=DATE(1900, 1.9, 2)', '=DATE(1915, 10, 24.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('01/01/1900')
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(dateNumberToString(engine.getCellValue(adr('B1')))).toEqual('01/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')))).toEqual('10/24/1915')
  })

  it('negative', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(-1900, 1, 1)', '=DATE(1901, -1, 2)', '=DATE(2000,-13,2)', '=DATE(1915, 10, -24)', '=DATE(1900, 1, -100000)', '=DATE(1900, 1, -200000)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(dateNumberToString(engine.getCellValue(adr('B1')))).toEqual('11/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')))).toEqual('11/02/1998')
    expect(dateNumberToString(engine.getCellValue(adr('D1')))).toEqual('09/06/1915')
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('rollover', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 14, 28)', '=DATE(1900, 14, 29)', '=DATE(1915, 100, 1000)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/28/1901')
    expect(dateNumberToString(engine.getCellValue(adr('B1')))).toEqual('03/01/1901')
    expect(dateNumberToString(engine.getCellValue(adr('C1')))).toEqual('12/25/1925')
  })

  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 1)'],
      ['=DATE(1900, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('with incoercible argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE("foo", 1, 1)'],
      ['=DATE(1900, "foo", 1)'],
      ['=DATE(1900, 1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('with coercible argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['="2000"', '=TRUE()'],
      ['=DATE(A1, 1, 1)'],
      ['=DATE(2000, B1, 1)'],
      ['=DATE(2000, 1, B1)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('01/01/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A3')))).toEqual('01/01/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A4')))).toEqual('01/01/2000')
  })

  it('precedence of errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(FOOBAR(), 4/0, 1)'],
      ['=DATE(2000, FOOBAR(), 4/0)'],
      ['=DATE(2000, 1, FOOBAR())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NAME))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2000'],
      ['2', '2001', '=DATE(B1:B3, 1, 1)', '=DATE(1950, A1:A3, 1)', '=DATE(1950, 1, A1:A3)'],
      ['3', '2002'],
    ])

    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('E2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})

describe( 'Function DATE + leap years', () =>{
  it('should support nonleap year 2001 ', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2001,02,29)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('03/01/2001')
  })

  it('should support leap year 2016', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2016,02,29)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/2016')
  })

  it('should support leap year 1920', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1920,02,29)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/1920')
  })

  it('should support nonleap year 1900', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('03/01/1900')
  })

  it('should support nonleap year 1900 with excel compatibility', () => {
    const config = new Config({leapYear1900: true})
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],
    ], config )
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/1900')
  })

  it('should support leap year 2400', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2400,02,29)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/2400')
  })

  it('should support null year', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(0,02,29)'],
      ['=DATE(30,02,28)'],
    ])
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('02/28/1930')
  })

  it('should throw a error in the absence of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE()'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual(detailedError(ErrorType.NA))
  })

  it('with blanks', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '', 'string', EmptyValue, '\''],
      ['=DATE(A1, 2, 3)'],
      ['=DATE(B1, 2, 3)'],
      ['=DATE(C1, 2, 3)'],
      ['=DATE(D1, 2, 3)'],
      ['=DATE(E1, 2, 3)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('02/03/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A3')))).toEqual('02/03/2000')
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.VALUE))
    expect(dateNumberToString(engine.getCellValue(adr('A5')))).toEqual('02/03/2000')
    expect(engine.getCellValue(adr('A6'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
