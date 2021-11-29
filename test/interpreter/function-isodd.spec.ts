import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ISODD', () => {
  it('number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISODD()', '=ISODD(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISODD(1)', '=ISODD(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })

  it('use coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISODD("42")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
  })

  it('propagates error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ISODD(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
