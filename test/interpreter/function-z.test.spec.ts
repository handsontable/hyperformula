import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Z.TEST', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=Z.TEST(1)'],
      ['=Z.TEST(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works (no sigma)', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=Z.TEST(A2:D2, 1)'],
      [1, 2, 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0100683757751732, 6)
  })

  it('works (with sigma)', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=Z.TEST(A2:D2, 1, 1)'],
      [1, 2, 3, 4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0013498980316301, 6)
  })

  it('validates input', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=Z.TEST(B1:C1, 1)', 1, null],
      ['=Z.TEST(B2:C2, 1, 1)', null, null],
      ['=Z.TEST(B3:C3, 1)', 1, 1],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.OneValue))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('doesnt do coercions, nonnumeric values are skipped', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=Z.TEST(B1:E1, 1, 1)', null, 2, 3, 4],
      ['=Z.TEST(B2:E2, 1, 1)', true, 2, 3, 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.000266002752569605, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.000266002752569605, 6)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=NA()', '50'],
      ['3', '30'],
      ['=Z.TEST(A1:B3, 1, 1)'],
    ])
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
