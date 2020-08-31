import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('null compatibility', () => {
  it('reference - default behaviour', () => {
    const engine = HyperFormula.buildFromArray([['=A2']], {nullCompatibility: false})
    expect(engine.getCellValue(adr('A1'))).toBeNull()
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('reference - compatibility', () => {
    const engine = HyperFormula.buildFromArray([['=A2']], {nullCompatibility: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('if - default behaviour', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(),A2)']], {nullCompatibility: false})
    expect(engine.getCellValue(adr('A1'))).toBeNull()
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('if - compatibility', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(),A2)']], {nullCompatibility: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeNull()
  })

  it('isblank - default behaviour', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2', '=ISBLANK(A1)'],
      [null, '=ISBLANK(A2)']
    ], {nullCompatibility: false})
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })

  it('isblank - compatibility', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2', '=ISBLANK(A1)'],
      [null, '=ISBLANK(A2)']
    ], {nullCompatibility: true})
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })
})
