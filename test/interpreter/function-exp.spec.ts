import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function EXP', () => {
  it('happy path',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP(0)', '=EXP(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(7.38905609893065)
  })

  it('given wrong argument type',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="2"', '=EXP(A1)'],
      ['=FALSE()', '=EXP(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(7.38905609893065)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('given wrong number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP()'],
      ['=EXP(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=EXP(A1:A3)'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
