import {EmptyValue, HandsOnEngine} from "../src";
import {simpleCellAddress} from "../src/Cell";
import {extractRange, extractReference} from "./testUtils";
import {CellAddress} from "../src/parser";
import './testConfig.ts'
import {EmptyCellVertex} from "../src/DependencyGraph";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";
import {EngineComparator} from "./graphComparator";

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

    const reference = extractReference(engine, simpleCellAddress(0, 1, 0))
    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
  });

  it('should update reference of moved formula - different types of reference', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo'],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 1), 1, 4, simpleCellAddress(0, 1, 0))

    expect(extractReference(engine, simpleCellAddress(0, 1, 0))).toEqual(CellAddress.relative(0, -1, 0))
    expect(extractReference(engine, simpleCellAddress(0, 1, 1))).toEqual(CellAddress.absoluteCol(0, 0, -1))
    expect(extractReference(engine, simpleCellAddress(0, 1, 2))).toEqual(CellAddress.absoluteRow(0, -1, 0))
    expect(extractReference(engine, simpleCellAddress(0, 1, 3))).toEqual(CellAddress.absolute(0, 0, 0))
  });


  it('should update reference of moved formula when moving to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      "Sheet1": [
        ['foo'],
        ['=A1'],
      ],
      "Sheet2": [
        ['', /* =A1 */]
      ]
    })

    engine.moveCells(simpleCellAddress(0, 0, 1), 1, 1, simpleCellAddress(1, 1, 0))

    expect(extractReference(engine, simpleCellAddress(1, 1, 0))).toEqual(CellAddress.relative(0, -1, 0))
  });

  it('should update reference', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo', /* foo */],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    expect(extractReference(engine, simpleCellAddress(0, 0, 1))).toEqual(CellAddress.relative(0, 1, -1))
    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.absoluteCol(0, 1, -2))
    expect(extractReference(engine, simpleCellAddress(0, 0, 3))).toEqual(CellAddress.absoluteRow(0, 1, 0))
    expect(extractReference(engine, simpleCellAddress(0, 0, 4))).toEqual(CellAddress.absolute(0, 1, 0))
  });

  it('value moved has appropriate edges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo', /* foo */],
      ['=A1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    const movedVertex = engine.dependencyGraph!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(movedVertex, engine.dependencyGraph!.fetchCell(simpleCellAddress(0, 0, 1)))).toBe(true)
  })

  it('should update reference when moving to different sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      "Sheet1": [
        ['foo'],
        ['=A1'],
      ],
      "Sheet2": []
    })

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(1, 1, 0))

    const reference = extractReference(engine, simpleCellAddress(0, 0, 1))
    expect(reference).toEqual(CellAddress.relative(1, 1, -1))
  });

  it('should override and remove formula', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 0, 1))

    expect(engine.graph.edgesCount()).toBe(0)
    expect(engine.graph.nodesCount()).toBe(1 + 1)
    expect(engine.getCellValue("A1")).toBe(EmptyValue)
    expect(engine.getCellValue("A2")).toBe(1)
  })

  it('moving empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '42'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))).toBe(null)
  })

  it('replacing formula dependency with null one', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '42'],
      ['=B1']
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['', ''],
      ['=B1']
    ]), engine).compare(0)
  })


  it('moving empty vertex to empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', ''],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))).toBe(null)
  })

  it('should adjust edges properly', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
      ['2', '=A2'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 0, 1))

    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const b2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 1))
    const source = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const target = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1))

    expect(engine.graph.edgesCount()).toBe(
      2 // A2 -> B1, A2 -> B2
    )
    expect(engine.graph.nodesCount()).toBe(
      + 1 // Empty singleton
      + 2 // formulas
      + 1 // A2
    )

    expect(source).toBe(null)
    expect(engine.graph.existsEdge(target, b2)).toBe(true)
    expect(engine.graph.existsEdge(target, b1)).toBe(true)
    expect(engine.getCellValue("A2")).toBe(1)
  })
})


describe('moving ranges', () => {
  it('should not update range when only part of it is moved', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* 1 */],
      ['2',],
      ['=SUM(A1:A2)']
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 1, 0))

    const range = extractRange(engine, simpleCellAddress(0, 0, 2))
    expect(range.start).toEqual(simpleCellAddress(0, 0, 0))
    expect(range.end).toEqual(simpleCellAddress(0, 0, 1))
    expect(engine.getCellValue("A3")).toEqual(2)

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const a2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1))
    const a1a2 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 1))!
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, a1a2)).toBe(true)
    expect(engine.graph.existsEdge(a2, a1a2)).toBe(true)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['' , '1'],
      ['2',    ],
      ['=SUM(A1:A2)']
    ]), engine).compare()
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

    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 1))).toBe(null)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['', '1'],
      ['', '2'],
      ['=SUM(B1:B2)']
    ]), engine).compare()
  })

  it('should not be possible to move area with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.moveCells(simpleCellAddress(0, 0, 1), 2, 2, simpleCellAddress(0, 2, 0))
    }).toThrow("It is not possible to move / replace cells with matrix")
  })

  it('should not be possible to move cells to area with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.moveCells(simpleCellAddress(0, 0, 0), 2, 1, simpleCellAddress(0, 0, 1))
    }).toThrow("It is not possible to move / replace cells with matrix")
  })

  it('should adjust edges when moving part of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 1, simpleCellAddress(0, 0, 1))

    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const b2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 1))
    const source = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const target = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1))
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 1))!

    expect(source).not.toBe(EmptyCellVertex.getSingletonInstance())
    expect(source.getCellValue()).toBe(EmptyValue)
    expect(engine.graph.nodesCount()).toBe(
        + 1 // Empty singleton
        + 2 // formulas
        + 1 // A2
        + 1 // A1 (Empty)
        + 1 // A1:A2 range
    )
    expect(engine.graph.edgesCount()).toBe(
        + 2 // A1 (Empty) -> A1:A2, A2 -> A1:A2
        + 1 // A1:A2 -> B1
        + 1 // A2 -> B2
    )
    expect(engine.graph.existsEdge(target, b2)).toBe(true)
    expect(engine.graph.existsEdge(source, range)).toBe(true)
    expect(engine.graph.existsEdge(target, range)).toBe(true)
    expect(engine.graph.existsEdge(range, b1)).toBe(true)
    expect(engine.getCellValue("A2")).toBe(1)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['' , '=SUM(A1:A2)'],
      ['1', '=A2'        ],
    ]), engine).compare()
  })

  it('should adjust edges when moving whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 2, simpleCellAddress(0, 2, 0))

    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const a2 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 1))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const b2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 1))
    const c1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0))
    const c2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 1))
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 2, 0), simpleCellAddress(0, 2, 1))!

    expect(a1).toBe(null)
    expect(a2).toBe(null)

    expect(engine.graph.nodesCount()).toBe(
        + 1 // Empty singleton
        + 2 // formulas
        + 2 // C1, C2
        + 1 // C1:C2 range
    )
    expect(engine.graph.edgesCount()).toBe(
        + 2 // C1 -> C1:C2, C2 -> C1:C2
        + 1 // C1:C2 -> B1
        + 1 // C2 -> B2
    )

    expect(engine.graph.existsEdge(c1, range)).toBe(true)
    expect(engine.graph.existsEdge(c2, range)).toBe(true)
    expect(engine.graph.existsEdge(range, b1)).toBe(true)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['' , '=SUM(C1:C2)', '1'],
      ['' , '=C2'        , '2'],
    ]), engine).compare()
  })

  it('should adjust edges when moving smaller range', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1', '',            /* 1 */],
        ['2', '=SUM(A1:A2)', /* 2 */],
        ['3', '=SUM(A1:A3)'         ],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 2, simpleCellAddress(0, 2, 0))

    /* ranges in formulas*/
    expect(extractRange(engine, simpleCellAddress(0, 1, 1))).toEqual(new AbsoluteCellRange(
        simpleCellAddress(0, 2, 0),
        simpleCellAddress(0, 2, 1),
    ))
    expect(extractRange(engine, simpleCellAddress(0, 1, 2))).toEqual(new AbsoluteCellRange(
        simpleCellAddress(0, 0, 0),
        simpleCellAddress(0, 0, 2),
    ))

    /* edges */
    const c1c2 = engine.rangeMapping.getRange(simpleCellAddress(0, 2, 0), simpleCellAddress(0, 2, 1))!
    const a1a3 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))!
    expect(engine.graph.existsEdge(c1c2, a1a3)).toBe(false)

    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)), a1a3)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1)), a1a3)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 2)), a1a3)).toBe(true)

    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0)), c1c2)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 1)), c1c2)).toBe(true)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['' , ''           , '1'],
      ['' , '=SUM(C1:C2)', '2'],
      ['3', '=SUM(A1:A3)',    ],
    ]), engine).compare()
  })

  it('should adjust edges when moving smaller ranges - more complex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '',            /* 1 */],
      ['2', '=SUM(A1:A2)', /* 2 */],
      ['3', '=SUM(A1:A3)'  /* 3 */],
      ['4', '=SUM(A1:A4)'         ],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 1, 3, simpleCellAddress(0, 2, 0))

    /* edges */
    const c1c2 = engine.rangeMapping.getRange(simpleCellAddress(0, 2, 0), simpleCellAddress(0, 2, 1))!
    const c1c3 = engine.rangeMapping.getRange(simpleCellAddress(0, 2, 0), simpleCellAddress(0, 2, 2))!
    const a1a4 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 3))!

    expect(engine.graph.existsEdge(c1c2, c1c3)).toBe(true)
    expect(engine.graph.existsEdge(c1c3, a1a4)).toBe(false)

    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1)), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 2)), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 3)), a1a4)).toBe(true)

    const c1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0))
    const c2 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 1))
    const c3 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 2))
    expect(engine.graph.existsEdge(c1, c1c2)).toBe(true)
    expect(engine.graph.existsEdge(c2, c1c2)).toBe(true)
    expect(engine.graph.existsEdge(c1, c1c3)).toBe(false)
    expect(engine.graph.existsEdge(c2, c1c3)).toBe(false)
    expect(engine.graph.existsEdge(c3, c1c3)).toBe(true)

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['' , ''            ,'1'],
      ['' , '=SUM(C1:C2)' ,'2'],
      ['' , '=SUM(C1:C3)' ,'3'],
      ['4', '=SUM(A1:A4)'     ],
    ]), engine).compare(0)
  })

  it('move wider dependent ranges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B1)', '=SUM(A1:B2)', '=SUM(A1:B3)']
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 2, 2, simpleCellAddress(0, 2, 0))

    new EngineComparator(HandsOnEngine.buildFromArray([
      ['', '', '1', '2'],
      ['', '', '3', '4'],
      ['5', '6'],
      ['=SUM(C1:D1)', '=SUM(C1:D2)', '=SUM(A1:B3)']
    ]), engine).compare(0)
  })
})
