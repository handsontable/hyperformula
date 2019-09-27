import {EmptyValue, HandsOnEngine} from "../src";

describe("add sheet to engine", () => {
  it('should add sheet to empty engine', function () {
    const engine = HandsOnEngine.buildEmpty()

    engine.addSheet()

    expect(engine.sheetMapping.numberOfSheets()).toEqual(1)
    expect(Array.from(engine.sheetMapping.names())).toEqual(["Sheet1"])
  });

  it('should add sheet to engine with one sheet', function () {
    const engine = HandsOnEngine.buildFromArray([
        ['foo']
    ])

    engine.addSheet()

    expect(engine.sheetMapping.numberOfSheets()).toEqual(2)
    expect(Array.from(engine.sheetMapping.names())).toEqual(["Sheet1", "Sheet2"])
  });

  it('should be possible to fetch empty cell from newly added sheet', function () {
    const engine = HandsOnEngine.buildEmpty()

    engine.addSheet()

    expect(engine.getCellValue("$Sheet1.A1")).toBe(EmptyValue)
  });
})
