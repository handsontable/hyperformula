import {CellError, Config, HandsOnEngine} from "../../src";
import {ErrorType} from "../../src/Cell";
import '../testConfig.ts'

describe('Function MATCH', () => {
  it('validates number of arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(1)'],
      ['=MATCH(1, B1:B3, 0, 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NA))
  })

  it('validates that 2nd argument is range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(1, 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('column - works when value is in first cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:A5)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('column - works when value is in the last cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:A5)'],
      ['200'],
      ['200'],
      ['200'],
      ['103'],
    ])

    expect(engine.getCellValue('A1')).toEqual(4)
  })

  it('column - returns the position in the range, not the row number', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(102, A2:A5)'],
      ['100'],
      ['101'],
      ['102'],
      ['103'],
    ])

    expect(engine.getCellValue('A1')).toEqual(3)
  })

  it('column - returns first result', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:A5)'],
      ['200'],
      ['103'],
      ['103'],
      ['200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })

  it('column - doesnt return result if value after searched range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:A5)'],
      ['200'],
      ['200'],
      ['200'],
      ['200'],
      ['103']
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('column - doesnt return result if value before searched range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A3:A5)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('row - works when value is in first cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:D2)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('row - works when value is in the last cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:D2)'],
      ['200', '200', '200', '103'],
    ])

    expect(engine.getCellValue('A1')).toEqual(4)
  })

  it('row - returns the position in the range, not the column number', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(102, B2:D2)'],
      ['100', '101', '102', '103'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })

  it('row - returns first result', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:D2)'],
      ['200', '103', '103', '200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })

  it('row - doesnt return result if value after searched range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, A2:D2)'],
      ['200', '200', '200', '200', '103'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('row - doesnt return result if value before searched range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MATCH(103, B2:D2)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })
})
