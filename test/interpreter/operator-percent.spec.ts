import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe("Percent operator", () => {
  it('works for obvious case', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3%'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.03)
  })

  it('use number coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['="3"%'],
      ['="foobar"%'],
      ['=TRUE()%'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.03)
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(0.01)
  })

  it('pass reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2%'],
      ['=42']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.42)
  })

  it('pass error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2%'],
      ['=FOOBAR()']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('works with other operator and coercion', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()%*1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.01)
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['9', '=A1:A3%'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
