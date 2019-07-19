import {HandsOnEngine} from "../src";
import {simpleCellAddress} from "../src/Cell";
import {extractRange, extractReference} from "./testUtils";
import {CellAddress} from "../src/parser";

describe("Move cells", () => {
  it('should move static content', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['foo'],
        [''],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 0, 1))
    expect(engine.getCellValue("A2")).toEqual('foo')
  });

  it('should update reference of moved formula', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo', /* =A1 */],
      ['=A1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 1), 1, 1, simpleCellAddress(0, 1, 0))

    /* reference */
    const reference = extractReference(engine, simpleCellAddress(0, 1, 0))
    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
  });

  it('should update reference', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo', /* foo */],
      ['=A1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    /* reference */
    const reference = extractReference(engine, simpleCellAddress(0, 0, 1))
    expect(reference).toEqual(CellAddress.relative(0, 1, -1))

    /* edge */
    const formulaVertex = engine.dependencyGraph!.fetchCell(simpleCellAddress(0, 0, 1))
    const movedVertex = engine.dependencyGraph!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(movedVertex, formulaVertex)).toBe(true)
  });

  it('should not update range when only part of it is moved', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* 1 */],
      ['2', ],
      ['=SUM(A1:A2)']
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    const range = extractRange(engine, simpleCellAddress(0, 0, 2))
    expect(range.start).toEqual(simpleCellAddress(0, 0, 0))
    expect(range.end).toEqual(simpleCellAddress(0, 0, 1))
    expect(engine.getCellValue("A3")).toEqual(2)
  })

  it('should update moved range', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1', /* 1 */],
        ['2', /* 2 */],
        ['=SUM(A1:A2)']
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 2, simpleCellAddress(0, 1, 0))

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 1, 1))).not.toBe(null)

    const range = extractRange(engine, simpleCellAddress(0, 0, 2))
    expect(range.start).toEqual(simpleCellAddress(0, 1, 0))
    expect(range.end).toEqual(simpleCellAddress(0, 1, 1))
    expect(engine.getCellValue("A3")).toEqual(3)
  })
})
