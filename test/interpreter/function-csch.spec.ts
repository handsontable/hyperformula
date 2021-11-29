import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CSCH', () => {
  it('happy path', () => {
    const [engine] = HyperFormula.buildFromArray([['=CSCH(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0.850918128239322)
  })

  it('when value not numeric', () => {
    const [engine] = HyperFormula.buildFromArray([['=CSCH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=CSCH()', '=CSCH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="-1"', '=CSCH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.850918128239322)
  })

  it('div/zero', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0, '=CSCH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CSCH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
