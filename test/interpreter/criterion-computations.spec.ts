import {HyperFormula} from '../../src'
import '../testConfig'
import {adr} from '../testUtils'

describe('Criterions - operators computations', () => {
  it('usage of greater than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(7)
  })

  it('usage of greater than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(12)
  })

  it('usage of less than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A2, "<1", B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('usage of less than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(8)
  })

  it('usage of equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('usage of not equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<>1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(10)
  })
})
