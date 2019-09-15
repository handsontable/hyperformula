import {CellError, Config, HandsOnEngine} from "../../src";
import {ErrorType} from "../../src/Cell";
import '../testConfig.ts'

describe('Function INDEX', () => {
  it('validates number of arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=INDEX()'],
      ['=INDEX(B1:D3, 1, 1, 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NA))
  })

  it('requires 2nd and 3rd arguments to be integers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=INDEX(B1:B1, "foo", 1)'],
      ['=INDEX(B1:B1, 1, "bar")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NUM))
  })

  it('requires 2nd argument to be in bounds of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=INDEX(B1:D3, -1, 1)'],
      ['=INDEX(B1:D3, 4, 1)'],
      ['=INDEX(42, -1, 1)'],
      ['=INDEX(42, 2, 1)'],
      ['=INDEX(B1, -1, 1)'],
      ['=INDEX(B1, 2, 1)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A5')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A6')).toEqual(new CellError(ErrorType.NUM))
  })

  it('requires 2nd and 3rd arguments to be in bounds of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=INDEX(B1:D3, 1, -1)'],
      ['=INDEX(B1:D3, 1, 4)'],
      ['=INDEX(42, 1, -1)'],
      ['=INDEX(42, 1, 2)'],
      ['=INDEX(B1, 1, -1)'],
      ['=INDEX(B1, 1, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A5')).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue('A6')).toEqual(new CellError(ErrorType.NUM))
  })

  it('works for range and nonzero arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=INDEX(B1:C2, 1, 1)', '1', '2'],
      ['=INDEX(B1:C2, 1, 2)', '3', '4'],
      ['=INDEX(B1:C2, 2, 1)'],
      ['=INDEX(B1:C2, 2, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
    expect(engine.getCellValue('A2')).toEqual(2)
    expect(engine.getCellValue('A3')).toEqual(3)
    expect(engine.getCellValue('A4')).toEqual(4)
  })
})
