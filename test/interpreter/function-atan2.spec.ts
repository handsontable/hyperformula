import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ATAN2', () => {
  it('happy path', () => {
    const [engine] = HyperFormula.buildFromArray([['=ATAN2(1,2)']], {smartRounding: false})

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.107148718, 6)
  })

  it('validates error', () => {
    const [engine] = HyperFormula.buildFromArray([['=ATAN2(0,0)']], {smartRounding: false})

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when value not numeric', () => {
    const [engine] = HyperFormula.buildFromArray([['=ATAN2(1,"foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=ATAN2()', '=ATAN2(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="-1"', '="1"', '=ATAN2(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(2.35619449019234)
  })

  it('errors propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ATAN2(4/0, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
