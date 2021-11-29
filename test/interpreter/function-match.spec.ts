import {ErrorType, HyperFormula} from '../../src'
import {DependencyGraph} from '../../src/DependencyGraph'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MATCH', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(1)'],
      ['=MATCH(1, B1:B3, 0, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('validates that 1st argument is number, string or boolean', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(C2:C3, B1:B1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('2nd argument can be a scalar', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(42, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('validates that 3rd argument is number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(0, B1:B1, "a")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should propagate errors properly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(1/0, B1:B1)'],
      ['=MATCH(1, B1:B1, 1/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('column - works when value is in first cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('column - works when value is in the last cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['200'],
      ['200'],
      ['103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('column - returns the position in the range, not the row number', () => {
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['103'],
      ['103'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('column - doesnt return result if value after searched range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:A5, 0)'],
      ['200'],
      ['200'],
      ['200'],
      ['200'],
      ['103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('column - doesnt return result if value before searched range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A3:A5, 0)'],
      ['103'],
      ['200'],
      ['200'],
      ['200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('row - works when value is in first cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('row - works when value is in the last cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '200', '200', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('row - returns the position in the range, not the column number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(102, E2:H2, 0)'],
      ['', '', '', '', '100', '101', '102', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('row - returns first result', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '103', '103', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('row - doesnt return result if value after searched range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, A2:D2, 0)'],
      ['200', '200', '200', '200', '103'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('row - doesnt return result if value before searched range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(103, B2:D2, 0)'],
      ['103', '200', '200', '200'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('uses binsearch', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = spyOn(DependencyGraph.prototype as any, 'computeListOfValuesInRange')

    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(400, A2:A5, 1)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ])

    expect(spy).not.toHaveBeenCalled()
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('uses indexOf', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = spyOn(DependencyGraph.prototype as any, 'computeListOfValuesInRange')

    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(400, A2:A5, 0)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ])

    expect(spy).toHaveBeenCalled()
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('returns lower bound match for sorted data', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(203, A2:A5, 1)'],
      ['100'],
      ['200'],
      ['300'],
      ['400'],
      ['500'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('should coerce empty arg to 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['-5'],
      ['-2'],
      ['0'],
      ['2'],
      ['5'],
      ['=MATCH(0, A1:A5)'],
      ['=MATCH(, A1:A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(3)
    expect(engine.getCellValue(adr('A7'))).toEqual(3)
  })

  it('should return NA when range is not a single column or row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '1'],
      ['2', '3'],
      ['=MATCH(0, A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('should properly report no match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH("0", A2:A5)'],
      [1],
      [2],
      [3],
      ['\'1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('should properly report approximate match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH("2", A2:A5)'],
      [1],
      [2],
      [3],
      ['\'1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('should coerce null to zero when using naive approach', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(, A2:A4, 0)'],
      [1],
      [3],
      [0],
    ], {useColumnIndex: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for strings, is not case sensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH("A", A2:A5, 0)'],
      ['a'],
      ['A'],
    ], {caseSensitive: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('works for strings, is not case sensitive even if config defines case sensitivity', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH("A", A2:A5, 0)'],
      ['a'],
      ['A'],
    ], {caseSensitive: true})

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })
})
