import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ColumnBinarySearch} from '../../src/ColumnSearch/ColumnBinarySearch'
import {adr, detailedError} from '../testUtils'

describe('Function MATCH', () => {
  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(1)'],
      ['=MATCH(1, B1:B3, 0, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('validates that 1st argument is number, string or boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(1/0, B1:B1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('validates that 2nd argument is range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(1, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('validates that 3rd argument is number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(0, B1:B1, 1/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('column - works when value is in first cell', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('column - works when value is in the last cell', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['200'],
      ['200'],
      ['103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('column - returns the position in the range, not the row number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(102, A6:A9, 0)'],
      [''],
      [''],
      [''],
      [''],
      ['100'],
      ['101'],
      ['102'],
      ['103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('column - returns first result', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['103'],
      ['103'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('column - doesnt return result if value after searched range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['200'],
      ['200'],
      ['200'],
      ['103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('column - doesnt return result if value before searched range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A3:A5, 0)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('row - works when value is in first cell', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('row - works when value is in the last cell', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '200', '200', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('row - returns the position in the range, not the column number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(102, E2:H2, 0)'],
      ['', '', '', '', '100', '101', '102', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('row - returns first result', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '103', '103', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('row - doesnt return result if value after searched range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '200', '200', '200', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('row - doesnt return result if value before searched range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(103, B2:D2, 0)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('uses binsearch', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = spyOn(ColumnBinarySearch.prototype as any, 'computeListOfValuesInRange')

    const engine = HyperFormula.buildFromArray([
      ['=MATCH(400, A2:A5, 1)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ], { vlookupThreshold: 1 })

    expect(spy).not.toHaveBeenCalled()
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('uses indexOf', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = spyOn(ColumnBinarySearch.prototype as any, 'computeListOfValuesInRange')

    const engine = HyperFormula.buildFromArray([
      ['=MATCH(400, A2:A5, 0)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ], { vlookupThreshold: 1 })

    expect(spy).toHaveBeenCalled()
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('returns lower bound match for sorted data', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(203, A2:A5, 1)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ], { vlookupThreshold: 1 })

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })
})
