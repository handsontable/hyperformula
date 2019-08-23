import {CellError, HandsOnEngine} from "../../src";
import {ErrorType} from "../../src/Cell";

describe('VLOOKUP - args validation', () => {
  it('not enough parameters', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('to many parameters', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, 2, TRUE(), "foo")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('wrong type of first argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(D1:D2, A2:B3, 2, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of second argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, "foo", 2, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of third argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, "foo", TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of fourth argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, 2, "bar")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })
})

describe('VLOOKUP', () => {
  it('should find value in sorted range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['=VLOOKUP(2, A1:B3, 2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual('b')
  })
})
