import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function RADIANS', () => {
  it('happy path',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RADIANS(0)', '=RADIANS(180.0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.1415)
  })

  it('given wrong argument type',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RADIANS("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="180"', '=RADIANS(A1)'],
      ['=TRUE()', '=RADIANS(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.1415)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(0.017453292519943295)
  })

  it('given wrong number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RADIANS()'],
      ['=RADIANS(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=RADIANS(A1:A3)'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RADIANS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
