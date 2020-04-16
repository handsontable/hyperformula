import {EmptyValue, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {Config} from '../../src/Config'
import {adr, dateNumberToString, detailedError} from '../testUtils'

describe('Function DATE', () => {
  it('with 3 numerical arguments', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 1, 1)', '=DATE(1900, 1, 2)', '=DATE(1915, 10, 24)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('01/01/1900')
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(dateNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('01/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('10/24/1915')
  })

  it('truncation', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900.9, 1, 1)', '=DATE(1900, 1.9, 2)', '=DATE(1915, 10, 24.9)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('01/01/1900')
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(dateNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('01/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('10/24/1915')
  })

  it('negative', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(-1900, 1, 1)', '=DATE(1901, -1, 2)', '=DATE(2000,-13,2)', '=DATE(1915, 10, -24)', '=DATE(1900, 1, -100000)', '=DATE(1900, 1, -200000)', '=DATE(-1,1,1)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(dateNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('11/02/1900')
    expect(dateNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('11/02/1998')
    expect(dateNumberToString(engine.getCellValue(adr('D1')), config)).toEqual('09/06/1915')
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('G1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('rollover', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 14, 28)', '=DATE(1900, 14, 29)', '=DATE(1915, 100, 1000)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/28/1901')
    expect(dateNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('03/01/1901')
    expect(dateNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('12/25/1925')
  })

  it('number of arguments', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 1)'],
      ['=DATE(1900, 1, 1, 1)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('with incoercible argument', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE("foo", 1, 1)'],
      ['=DATE(1900, "foo", 1)'],
      ['=DATE(1900, 1, "foo")'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('with coercible argument', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['="2000"', '=TRUE()'],
      ['=DATE(A1, 1, 1)'],
      ['=DATE(2000, B1, 1)'],
      ['=DATE(2000, 1, B1)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('01/01/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A3')), config)).toEqual('01/01/2000')
    expect(dateNumberToString(engine.getCellValue(adr('A4')), config)).toEqual('01/01/2000')
  })

  it('precedence of errors', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(FOOBAR(), 4/0, 1)'],
      ['=DATE(2000, FOOBAR(), 4/0)'],
      ['=DATE(2000, 1, FOOBAR())'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NAME))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['1', '2000'],
      ['2', '2001', '=DATE(B1:B3, 1, 1)', '=DATE(1950, A1:A3, 1)', '=DATE(1950, 1, A1:A3)'],
      ['3', '2002'],
    ], config)
    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('E2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})

describe( 'Function DATE + leap years', () =>{
  it('should support nonleap year 2001 ', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2001,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/2001')
  })

  it('should support leap year 2016', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2016,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2016')
  })

  it('should support leap year 1920', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1920,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/1920')
  })

  it('should support nonleap year 1900', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/1900')
  })

  it('should support nonleap year 1900 with excel compatibility', () => {
    const config = new Config({leapYear1900: true})
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/1900')
  })

  it('should support leap year 2400', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2400,02,29)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2400')
  })

  it('small year values', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(0,02,29)'],
      ['=DATE(1800,02,28)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/28/3700')
  })

  it('different nullDate', () => {
    const config = new Config({nullDate: {year: 1900, day: 1, month: 1}})
    const engine = HyperFormula.buildFromArray([
      ['=DATE(0,02,28)'],
      ['=DATE(1800,02,28)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/28/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/28/3700')
  })

  it('should be leap1900 sensitive', () => {
    const config = new Config({leapYear1900: true})
    const engine = HyperFormula.buildFromArray([
      ['=DATE(10,03,03)'],
      ['=DATE(1800,02,28)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/03/1909')
    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/28/3699')
  })

  it('different nullDate, leap1900 sensitive', () => {
    const config = new Config({nullDate: {year: 1899, day: 31, month: 12}, leapYear1900: true})
    const engine = HyperFormula.buildFromArray([
      ['=DATE(0,02,28)'],
      ['=DATE(0,02,29)'],
      ['=DATE(1800,02,28)'],
    ], config)
    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/28/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/29/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A3')), config)).toEqual('02/28/3700')
  })

  it('should throw a error in the absence of arguments', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE()'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual(detailedError(ErrorType.NA))
  })

  it('with blanks', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      [null, '', 'string', EmptyValue, '\''],
      ['=DATE(A1, 2, 3)'],
      ['=DATE(B1, 2, 3)'],
      ['=DATE(C1, 2, 3)'],
      ['=DATE(D1, 2, 3)'],
      ['=DATE(E1, 2, 3)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/03/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A3')), config)).toEqual('02/03/1900')
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.VALUE))
    expect(dateNumberToString(engine.getCellValue(adr('A5')), config)).toEqual('02/03/1900')
    expect(dateNumberToString(engine.getCellValue(adr('A6')), config)).toEqual('02/03/1900')
  })
})
