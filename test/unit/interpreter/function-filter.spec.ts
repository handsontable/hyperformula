import {ErrorType, HyperFormula, Sheets} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FILTER', () => {
  it('should return an error for 2-dimensional arrays', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(D2:E3, D2:E3)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongDimension))
  })

  it('should return an error if arrays have different dimensions', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(D2:D3, D2:D3, D2:D4)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('should return an error if param1 is not a range', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(1, FALSE())']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EmptyRange))
  })

  it('should filter a horizontal range if one condition is passed', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(A2:C2,A3:C3)'], [1, 2, 3], [true, false, true]])

    expect(engine.getSheetValues(0)).toEqual([[1, 3], [1, 2, 3], [true, false, true]])
  })

  it('should filter a horizontal range if two conditions are passed', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(A2:C2,A3:C3,A4:C4)'], [1, 2, 3], [true, false, true], [true, true, false]])

    expect(engine.getSheetValues(0)).toEqual([[1], [1, 2, 3], [true, false, true], [true, true, false]])
  })

  it('should filter a vertical range ', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(B1:B3,C1:C3)', 1, true], [undefined, 2, false], [undefined, 3, true]])

    expect(engine.getSheetValues(0)).toEqual([[1, 1, true], [3, 2, false], [null, 3, true]])
  })

  it('should enable array arithmetic implicitly', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(2*A2:C2,A3:C3)'], [1, 2, 3], [true, true, true]])

    expect(engine.getSheetValues(0)).toEqual([[2, 4, 6], [1, 2, 3], [true, true, true]])
  })

  it('should allow to construct a multidimensional array by calling filter for each column separately', () => {
    const sheets: Sheets = {
      Data: [
        ['a', 1, 42],
        ['b', 2, 42],
        ['a', 3, 42],
        ['b', 4, 42],
      ],
      Result: [[
        '=FILTER(Data!A1:A4, Data!A1:A4="a")',
        '=FILTER(Data!B1:B4, Data!A1:A4="a")',
        '=FILTER(Data!C1:C4, Data!A1:A4="a")',
      ]],
    }

    const engine = HyperFormula.buildFromSheets(sheets)
    const result = engine.getSheetValues(engine.getSheetId('Result') as number)

    expect(result).toEqual([
      ['a', 1, 42],
      ['a', 3, 42],
    ])
  })
})
