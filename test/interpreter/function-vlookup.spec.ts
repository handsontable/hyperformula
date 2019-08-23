import {CellError, HandsOnEngine} from "../../src";
import {ErrorType} from "../../src/Cell";

describe('VLOOKUP', () => {
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
