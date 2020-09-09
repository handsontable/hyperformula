import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TAN', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=TAN(0)', '=TAN(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.546302489843791)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=TAN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=TAN()', '=TAN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=TAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1.5574077246549)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TAN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=TAN(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
