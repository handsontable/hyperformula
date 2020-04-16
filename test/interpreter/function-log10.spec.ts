import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function LOG10', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=LOG10(10)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=LOG10("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('for zero', () => {
    const engine = HyperFormula.buildFromArray([['=LOG10(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('for negative arguments', () => {
    const engine = HyperFormula.buildFromArray([['=LOG10(-42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=LOG10()', '=LOG10(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="10"', '=LOG10(A1)'],
      ['', '=LOG10(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=LOG10(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=LOG10(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
