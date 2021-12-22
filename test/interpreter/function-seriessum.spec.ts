import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SERIESSUM', () => {
  it('checks required number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(1,2,3)'],
      ['=SERIESSUM(1,2,3,4,5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('computes correct answer', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(2,3,4,A2:D2)'],
      [1, 2, 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(137480)
  })

  it('ignores nulls', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(2,3,4,A2:D2)'],
      [1, null, 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(8584)
  })

  it('throws error for non-numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(2,3,4,A2:D2)'],
      [1, '\'1', 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberExpected))
  })

  it('works for non-integer args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(2,3.1,4,A3:D3)'],
      ['=SERIESSUM(2,3,4.1,A3:D3)'],
      [1, 2, 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(147347.41562949, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(168708.537245456, 6)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SERIESSUM(2,3,4,A2:D2)'],
      [1, '=NA()', 3, 4]
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
