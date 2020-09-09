import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COTH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=COTH(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.31303528549933)
  })

  it('DIV/0 for zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COTH(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=COTH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=COTH()', '=COTH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=COTH(A1)'],
      ['', '=COTH(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1.31303528549933)
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COTH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=COTH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
