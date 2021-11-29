import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('F.TEST', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.TEST(1)'],
      ['=F.TEST(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['2', '5'],
      ['=F.TEST(A1:A2, B1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.2513318328, 6)
  })

  it('works for uneven ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '3'],
      [null, '1'],
      ['=F.TEST(A1:A2, B1:B3)']
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.794719414238988, 6)
  })

  it('doesnt do coercions, nonnumeric values are skipped', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['5', '3'],
      [null, '6'],
      [true, false],
      ['8'],
      ['=F.TEST(A1:A4, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(1, 6)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=4/0', '50'],
      ['3', '30'],
      ['=F.TEST(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('error when not enough data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.TEST(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('error when 0 variance', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.TEST(A2:C2, A3:C3)'],
      [1, 1, 1],
      [0, 1, 0],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
