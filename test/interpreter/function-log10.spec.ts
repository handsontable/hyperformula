import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOG10', () => {
  it('happy path', () => {
    const [engine] = HyperFormula.buildFromArray([['=LOG10(10)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('when value not numeric', () => {
    const [engine] = HyperFormula.buildFromArray([['=LOG10("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('for zero', () => {
    const [engine] = HyperFormula.buildFromArray([['=LOG10(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('for negative arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=LOG10(-42)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=LOG10()', '=LOG10(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="10"', '=LOG10(A1)'],
      ['', '=LOG10(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('errors propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOG10(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
