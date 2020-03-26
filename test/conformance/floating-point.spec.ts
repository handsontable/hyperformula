import { HyperFormula } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { Config } from '../../src/Config'

// Test cases based on https://github.com/MicrosoftDocs/OfficeDocs-Support/blob/public/Office/Client/excel/floating-point-arithmetic-inaccurate-result.md

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

  it('addition of small numbers without smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], ({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789)  
  })

  it('addition of small numbers with smartRounding', () => { 
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789) 
  })

  it('addition of small numbers with smartRounding and with precisionRounding=15', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], new Config({ precisionRounding: 15, smartRounding: true }))
  
    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789)  
  })

  it('adding a negative number with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=(43.1-43.2)+1'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0.9)  
  })

  it('adding a negative number without smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=(43.1-43.2)+1'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0.8999999999999986)  
  })

  it('example when a value reaches zero without smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1.333+1.225-1.333-1.225'],
    ], new Config({ smartRounding: false }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(-2.220446049250313E-16)  
  })

  it('Example when a value reaches zero with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1.333+1.225-1.333-1.225'],
    ], new Config({ smartRounding: true }))
  
    expect(engine.getCellValue(adr('A1'))).toEqual(0)  
  })

})


