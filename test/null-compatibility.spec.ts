import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('null compatibility', () => {
  it('should evaluate empty reference to null', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2']], {evaluateNullToZero: false})
    expect(engine.getCellValue(adr('A1'))).toBeNull()
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('should evaluate empty reference to 0', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2']], {evaluateNullToZero: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('should evaluate if to null', () => {
    const [engine] = HyperFormula.buildFromArray([['=IF(TRUE(),A2)']], {evaluateNullToZero: false})
    expect(engine.getCellValue(adr('A1'))).toBeNull()
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('should evaluate if to 0', () => {
    const [engine] = HyperFormula.buildFromArray([['=IF(TRUE(),A2)']], {evaluateNullToZero: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('should evaluate isblank with null', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2', '=ISBLANK(A1)'],
      [null, '=ISBLANK(A2)']
    ], {evaluateNullToZero: false})
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })

  it('should evaluate isblank with 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2', '=ISBLANK(A1)'],
      [null, '=ISBLANK(A2)']
    ], {evaluateNullToZero: true})
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })
})
