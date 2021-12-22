import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FILTER', () => {
  it('validates input #1', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(D2:E3, D2:E3)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongDimension))
  })

  it('validates input #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(D2:D3, D2:D3, D2:D4)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('validates input #3', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(1, FALSE())']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EmptyRange))
  })

  it('works #1', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(A2:C2,A3:C3)'], [1, 2, 3], [true, false, true]])

    expect(engine.getSheetValues(0)).toEqual([[1, 3], [1, 2, 3], [true, false, true]])
  })

  it('works #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(A2:C2,A3:C3,A4:C4)'], [1, 2, 3], [true, false, true], [true, true, false]])

    expect(engine.getSheetValues(0)).toEqual([[1], [1, 2, 3], [true, false, true], [true, true, false]])
  })

  it('works #3', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(B1:B3,C1:C3)', 1, true], [undefined, 2, false], [undefined, 3, true]])

    expect(engine.getSheetValues(0)).toEqual([[1, 1, true], [3, 2, false], [null, 3, true]])
  })

  it('enables array arithmetic', () => {
    const [engine] = HyperFormula.buildFromArray([['=FILTER(2*A2:C2,A3:C3)'], [1, 2, 3], [true, true, true]])

    expect(engine.getSheetValues(0)).toEqual([[2, 4, 6], [1, 2, 3], [true, true, true]])
  })
})
