import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function SEC', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=SEC(0)', '=SEC(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.85081571768093)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=SEC("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SEC()', '=SEC(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=SEC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.85081571768093)
  })

  it('close to div/zero', () => {
    const engine =  HyperFormula.buildFromArray([
      [1.57079632679486, '=SEC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(27249001701268.1)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SEC(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=SEC(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.WrongType))
  })
})
