import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COSH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=COSH(0)', '=COSH(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.54308063481524)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=COSH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=COSH()', '=COSH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=COSH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.54308063481524)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COSH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=COSH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
