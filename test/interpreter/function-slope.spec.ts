import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('SLOPE', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SLOPE(B1:B5)'],
      ['=SLOPE(B1:B5, C1:C5, D1:D5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('ranges need to have same amount of elements', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SLOPE(B1:B5, C1:C6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('works (simple)', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0, 0, 1],
      [0, 1, 0],
      ['=SLOPE(A1:C1, A2:C2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(-0.5)
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['2', '4'],
      ['5', '3'],
      ['7', '6'],
      ['1', '1'],
      ['8', '5'],
      ['=SLOPE(A1:A5, B1:B5)']
    ])

    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(1.256756757, 6)
  })

  it('error when not enough data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=SLOPE(A1:A1, B1:B1)'],
      ['=SLOPE(42, 43)'],
      ['=SLOPE("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues))
  })

  it('doesnt do coercions, nonnumeric values are skipped', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0, 0],
      ['="2"', '50'],
      [1, 0],
      [0, 1],
      ['=SLOPE(A1:A4, B1:B4)'],
    ])

    expect(engine.getCellValue(adr('A5'))).toEqual(-0.5)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['=SLOPE(MMULT(A1:B2, A1:B2), MMULT(B1:C2, B1:C2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.75346687211094, 6)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=NA()', '50'],
      ['3', '30'],
      ['=SLOPE(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
