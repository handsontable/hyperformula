import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('T.TEST', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.TEST(1, 2, 3)'],
      ['=T.TEST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for mode 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10],
      [2, 5],
      ['=T.TEST(A1:A2, B1:B2, 1, 1)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.1475836177, 6)
  })

  it('works for mode 2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10],
      [2, 5],
      ['=T.TEST(A1:A2, B1:B2, 1, 2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.07142857143, 6)
  })

  it('works for mode 3', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10],
      [2, 5],
      ['=T.TEST(A1:A2, B1:B2, 1, 3)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.1203798536, 6)
  })

  it('works for larger ranges for mode 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:F1, A2:F2, 2, 1)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.741153821738662, 9)
  })

  it('works for larger ranges for mode 2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:F1, A2:F2, 2, 2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.8654794555, 9)
  })

  it('works for larger ranges for mode 3', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:F1, A2:F2, 2, 3)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.8658288672, 9)
  })

  it('validates range length for mode 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:E1, A2:F2, 1, 1)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('works for distinct length ranges for mode 2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:E1, A2:F2, 1, 2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.442070764, 6)
  })

  it('works for distinct length ranges for mode 3', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3],
      [2, 5, 1, 1, 4, 8],
      ['=T.TEST(A1:E1, A2:F2, 1, 3)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.4444544032, 6)
  })

  it('doesnt do coercions, nonnumeric values are skipped for mode 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3],
      [2, 5, null, 1, 4, 8],
      ['=T.TEST(A1:E1, A2:F2, 1, 1)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.3298741207, 9)
  })

  it('doesnt do coercions, nonnumeric values are skipped for mode 2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, null, 1, 4, 8],
      ['=T.TEST(A1:F1, A2:F2, 1, 2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.4684423056, 9)
  })

  it('doesnt do coercions, nonnumeric values are skipped for mode 3', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 10, 1, 1, 3, 7],
      [2, 5, null, 1, 4, 8],
      ['=T.TEST(A1:F1, A2:F2, 1, 3)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.4674248166, 9)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=NA()', '50'],
      ['3', '30'],
      ['=T.TEST(A1:A3, B1:B3, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('error when not enough data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.TEST(1, 2, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
  })
})
