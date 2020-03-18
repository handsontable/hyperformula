import { HyperFormula, DetailedCellError } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { EmptyValue } from '../../src/Cell'
import { Config } from '../../src/Config'

// Test cases based on https://github.com/MicrosoftDocs/OfficeDocs-Support/blob/public/Office/Client/excel/floating-point-arithmetic-inaccurate-result.md
const data =
    ['=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']

function createEngine(data: any[][]) {
  const engine = HyperFormula.buildFromArray(data)

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress))
    }
  }
}
describe('Quality assurance of floating point', () => {
  it('addition of big numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.2E+200', '1E+100', '=A1+B1'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.20E+200)  
  })

  it('addition of small numbers with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789)  
  })

  xit('addition of small numbers with smartRounding', () => { //pending on #257
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123457) //as GS and E
  })

  xit('addition of small numbers with smartRounding and with precisionRounding=15', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], new Config({ precisionRounding: 15, smartRounding: true }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123457)  //as GS and E, now return 1.000123456789
  })

  it('adding a negative number with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=(43.1-43.2)+1'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0.9)  //as GS and E
  })

  it('adding a negative number without smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=(43.1-43.2)+1'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0.8999999999999986)  //as GS and E
  })

  it('example when a value reaches zero without smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1.333+1.225-1.333-1.225'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(-2.220446049250313E-16)  //as Gnumeric and E with scientific format
  })

  it('Example when a value reaches zero with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1.333+1.225-1.333-1.225'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0)  //E and GS retun 0
  })

})


