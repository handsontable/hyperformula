import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DEGREES', () => {
  it('happy path', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEGREES(0)', '=DEGREES(3.14)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(179.9087477)
  })

  it('given wrong argument type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEGREES("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('use number coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="3.14"', '=DEGREES(A1)'],
      ['=TRUE()', '=DEGREES(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(179.9087477)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(57.29577951)
  })

  it('given wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEGREES()'],
      ['=DEGREES(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('errors propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEGREES(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
