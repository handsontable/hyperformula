import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COS', () => {
  it('happy path', () => {
    const [engine] = HyperFormula.buildFromArray([['=COS(0)', '=COS(7)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.753902254343305)
  })

  it('when value not numeric', () => {
    const [engine] = HyperFormula.buildFromArray([['=COS("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=COS()', '=COS(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="-1"', '=COS(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.54030230586814)
  })

  it('errors propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
