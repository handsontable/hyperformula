import {HandsOnEngine} from "../src";

describe('remove sheet from engine', () => {
  xit('should remove sheet by id', () => {
    const engine = HandsOnEngine.buildFromArray([['foo']])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  });
})
