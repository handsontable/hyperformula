import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('CHISQ.TEST', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.TEST(1)'],
      ['=CHISQ.TEST(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10],
      [2, 5],
      ['=CHISQ.TEST(A1:A2, B1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.001652787719, 6)
  })

  it('works for larger ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 8],
      ['=CHISQ.TEST(A1:C2, D1:F2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.00000054330486, 9)
  })

  /**
   * product #2 accepts this as a valid input
   */
  it('validates dimensions', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 8],
      ['=CHISQ.TEST(A1:C2, A1:F1)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('validates values #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 0],
      ['=CHISQ.TEST(A1:C2, D1:F2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('accepts negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, -1],
      ['=CHISQ.TEST(A1:C2, D1:F2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.0000858340104264999, 9)
  })

  it('but checks intermediate values for negatives', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, -0.001],
      ['=CHISQ.TEST(A1:C2, D1:F2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('doesnt do coercions, nonnumeric values are skipped', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, null, 1, 4, 8],
      ['=CHISQ.TEST(A1:C2, D1:F2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.00001161637011, 9)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=NA()', '50'],
      ['3', '30'],
      ['=CHISQ.TEST(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('error when not enough data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.TEST(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
  })
})
