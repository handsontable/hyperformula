import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function CSCH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=CSCH(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0.850918128239322)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=CSCH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=CSCH()', '=CSCH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=CSCH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.850918128239322)
  })

  it('div/zero', () => {
    const engine =  HyperFormula.buildFromArray([
      [0, '=CSCH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=CSCH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=CSCH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
