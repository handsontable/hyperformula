import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ABS', () => {
  it('happy path',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ABS(-1)', '=ABS(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('given wrong argument type',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ABS("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="2"', '=ABS(A1)'],
      ['=TRUE()', '=ABS(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('given wrong number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ABS()'],
      ['=ABS(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=ABS(A1:A3)'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ABS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
