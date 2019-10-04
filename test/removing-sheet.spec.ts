import {HandsOnEngine} from "../src";
import './testConfig.ts'
import {adr, expect_reference_to_have_ref_error, expectEngineToBeTheSameAs, extractReference} from "./testUtils";
import {CellAddress} from "../src/parser";

describe('remove sheet', () => {
  it('should remove sheet by id', () => {
    const engine = HandsOnEngine.buildFromArray([['foo']])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  });

  it('should remove empty sheet', () => {
    const engine = HandsOnEngine.buildFromArray([])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  });

  it('should decrease last sheet id when removing last sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [],
      'Sheet2': [],
    })

    engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet2'])
  })

  it('should not decrease last sheet id when removing sheet other than last', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [],
      'Sheet2': [],
      'Sheet3': [],
    })

    engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet3'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet3', 'Sheet4'])
  })
})

describe('remove sheet - adjust edges', () => {
  it('should not affect dependencies to sheet other than removed', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
        ['1', '=A1']
      ],
      'Sheet2': [
        ['1']
      ]
    })

    engine.removeSheet(1)

    const a1 = engine.addressMapping.fetchCell(adr("A1"))
    const b1 = engine.addressMapping.fetchCell(adr("B1"))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  });

  it('should remove edge between sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
        ['=$Sheet2.A1']
      ],
      'Sheet2': [
        ['1']
      ]
    })

    const a1_1 = engine.addressMapping.fetchCell(adr("A1"))
    const a1_2 = engine.addressMapping.fetchCell(adr("A1", 1))
    expect(engine.graph.existsEdge(a1_2, a1_1)).toBe(true)

    engine.removeSheet(1)

    expect(engine.graph.existsEdge(a1_2, a1_1)).toBe(false)
  });
})

describe('remove sheet - adjust formula dependencies', () => {
  it('should not affect formula with dependency to sheet other than removed', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
        ['1', '=A1']
      ],
      'Sheet2': [
        ['1']
      ]
    })

    engine.removeSheet(1)

    const reference = extractReference(engine, adr("B1"))

    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([['1', '=A1']]))
  });

  it('should be #REF after removing sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
        ['=$Sheet2.A1']
      ],
      'Sheet2': [
        ['1']
      ]
    })

    engine.removeSheet(1)

    expect_reference_to_have_ref_error(engine, adr("A1"))
    // expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([['=$Sheet2.A1']]))
  });
});
