import {HandsOnEngine} from "../src";
import {simpleCellAddress} from "../src/Cell";
import {extractReference} from "./testUtils";
import {CellAddress} from "../src/parser";

describe("Move cells", () => {
  it('should move static content', function () {
    const engine = HandsOnEngine.buildFromArray([
        ['foo'],
        [''],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 0, 1))
    expect(engine.getCellValue("A2")).toEqual('foo')
  });

  it('should update reference of moved formula', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['foo', /* =A1 */],
      ['=A1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 1), 1, 1, simpleCellAddress(0, 1, 0))

    /* reference */
    const reference = extractReference(engine, simpleCellAddress(0, 1, 0))
    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
  });

  it('should update reference', function () {
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
})
