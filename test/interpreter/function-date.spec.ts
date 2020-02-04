import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, dateNumberToString} from '../testUtils'

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

  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900, 1)'],
      ['=DATE(1900, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NA))
  })

  it('with incoercible argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE("foo", 1, 1)'],
      ['=DATE(1900, "foo", 1)'],
      ['=DATE(1900, 1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
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

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NAME))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2000'],
      ['2', '2001', '=DATE(B1:B3, 1, 1)', '=DATE(1950, A1:A3, 1)', '=DATE(1950, 1, A1:A3)'],
      ['3', '2002'],
    ])

    expect(engine.getCellValue(adr('C2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('E2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})

describe( 'Function DATE + leap years', () =>{
  it('should support nonleap year 2001 ', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2001,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/28/2001');
  })


  it('should suport leap year 2016', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2016,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/2016');

  })

  it('should suport leap year 2020', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2020,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('02/29/2020');
  })

  it('should suport leap year 2024', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2024,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A3')))).toEqual('02/29/2024');

  })

  it('should suport leap year 2028', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2028,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A4')))).toEqual('02/29/2028');
  })

  it('should suport leap year 2032', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2032,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A4')))).toEqual('02/29/2032');
  })

  it('should suport leap year 2040', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2040,02,29)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('02/29/2040');
  })
})
