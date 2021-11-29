import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ISEVEN', () => {
  it('number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISEVEN()', '=ISEVEN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISEVEN(1)', '=ISEVEN(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
  })

  it('use coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISEVEN("42")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
  })

  it('propagates error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ISEVEN(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
