import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('STEYX', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STEYX(B1:B5)'],
      ['=STEYX(B1:B5, C1:C5, D1:D5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('ranges need to have same amount of elements', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STEYX(B1:B5, C1:C6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('works (simple)', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0, 0, 1],
      [0, 1, 0],
      ['=STEYX(A1:C1, A2:C2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.7071067812, 6)
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['2', '4'],
      ['5', '3'],
      ['7', '6'],
      ['1', '1'],
      ['8', '5'],
      ['=STEYX(A1:A5, B1:B5)']
    ])

    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(2.146650439, 6)
  })

  it('error when not enough data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=STEYX(A1:B1, A1:B1)'],
      ['=STEYX(42, 43)'],
      ['=STEYX("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.ThreeValues))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.ThreeValues))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.ThreeValues))
  })

  it('doesnt do coercions, nonnumeric values are skipped', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0, 0],
      ['="2"', '50'],
      [1, 0],
      [0, 1],
      ['=STEYX(A1:A4, B1:B4)'],
    ])

    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.707106781186548, 6)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['=STEYX(MMULT(A1:B2, A1:B2), MMULT(B1:C2, B1:C2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.526640075265055, 6)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=NA()', '50'],
      ['3', '30'],
      ['=STEYX(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
