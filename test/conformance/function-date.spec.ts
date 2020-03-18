import { HyperFormula, DetailedCellError } from '../../src'
import { CellError, ErrorType, CellType, EmptyValue } from '../../src/Cell'
import '../testConfig'
import { adr, dateNumberToString, detailedError } from '../testUtils'
import { Config } from '../../src/Config'

// Data and test scenarios were part of the working draft for OpenFormula standard
// https://www.oasis-open.org/committees/download.php/16826/openformula-spec-20060221.html#DATE

function createEngine(data: any[][]) {
  const engine = HyperFormula.buildFromArray(data)

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress))
    }
  }
}

describe('Acceptance tests DATE function', () => {
  it('should support simple date', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2005,1,31)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('01/31/2005')
  })

  it('should support date with small case', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=date(8755,12,25)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('12/25/8755')
  })


  it('should support MIN date 1900/01/01', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,01,01)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('01/01/1900')
  })

  it('should support MAX date 9999/12/31', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(9999,12,31)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('12/31/9999')
  })

  it('should handle "00X" in month number', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1990,009,10)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('09/10/1990')
  })

  it('should handle white spaces in DATE', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1990, 10, 09)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('10/09/1990')
  })

  it('should support nonleap year 1900', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/1900')
  })

  it('should support nonleap year 1995', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1995,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/1995')
  })

  it('should support nonleap year 2001', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2001,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/2001')
  })

  it('should support nonleap year 2100', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2100,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('03/01/2100')
  })

  it('should support leap year 1996', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1996,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/1996')

  })

  it('should support leap year 2016', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2016,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2016')

  })

  it('should support leap year 2020', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2020,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2020')
  })

  it('should support leap year 2024', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2024,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2024')

  })

  it('should support leap year 2028', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2028,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2028')
  })

  it('should support leap year 2032', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2032,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2032')
  })

  it('should support leap year 2040', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2040,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2040')
  })

  it('should support leap year 2400', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2400,02,29)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('02/29/2400')
  })

  it('should throw a error in the absence of arguments', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE()'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual((new DetailedCellError(new CellError(ErrorType.NA), '#N/A')))
  })

  it('should show nullYear, when null is given by reference', () => {
    const config = new Config() 
    const engine = HyperFormula.buildFromArray([
      [null],
      ['=DATE(A1, 2, 3)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/03/1900')
  })

  it('should throw an error #VALUE!, when string is given by reference', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['test'],
      ['=DATE(A1, 2, 3)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should show nullYear, when empty string is given by reference', () => {
    const config = new Config() //pending for #191
    const engine = HyperFormula.buildFromArray([
      [''],
      ['=DATE(A1, 2, 3)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/03/1900')
  })

  it('should show nullYear, when EmptyValue is given by reference', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      [EmptyValue],
      ['=DATE(A1, 2, 3)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('02/03/1900')
  })

  xit('should throw an error when EmptyValue is given directly', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([
      ['=DATE(EmptyValue, 2, 3)'],
    ], config)

    expect(dateNumberToString(engine.getCellValue(adr('A1')), config)).toEqual(ErrorType.NAME) //E and GS return #VALUE!, HF return #ERROR!
  })


})





