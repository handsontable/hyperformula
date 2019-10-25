import {Config, EmptyValue, HandsOnEngine} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {simpleCellAddress} from '../../src/Cell'
import {EmptyCellVertex} from '../../src/DependencyGraph'
import {CellAddress} from '../../src/parser'
import '../testConfig'
import {
  adr, expect_array_with_same_content, expect_function_to_have_ref_error,
  expect_reference_to_have_ref_error,
  expectEngineToBeTheSameAs,
  extractMatrixRange,
  extractRange,
  extractReference,
} from '../testUtils'
import {privateDecrypt} from "crypto";
import {ColumnIndex} from "../../src/ColumnSearch/ColumnIndex";

describe('Address dependencies, moved formulas', () => {
  it('should update dependency to external cell when not overriding it', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo'],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(adr('A2'), 1, 4, adr('B1'))

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1, 0))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.absoluteCol(0, 0, -1))
    expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.absoluteRow(0, -1, 0))
    expect(extractReference(engine, adr('B4'))).toEqual(CellAddress.absolute(0, 0, 0))
  })

  it('should return #REF when overriding referred dependency to external cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '1'],
      ['=$B2', '2'],
      ['=B$3', '3'],
      ['=$B$4', '4'],
    ])

    engine.moveCells(adr('A1'), 1, 4, adr('B1'))

    expect_reference_to_have_ref_error(engine, adr('B1'))
    expect_reference_to_have_ref_error(engine, adr('B2'))
    expect_reference_to_have_ref_error(engine, adr('B3'))
    expect_reference_to_have_ref_error(engine, adr('B4'))
  })

  it('should return #REF when any of moved cells overrides external dependency', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B2', '1'],
      ['3', '2'],
    ])

    engine.moveCells(adr('A1'), 1, 2, adr('B1'))

    expect_reference_to_have_ref_error(engine, adr('B1'))
  })

  it('should update internal dependency when overriding dependent cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B$2', ''],
      ['', ''],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('B2'))

    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.absoluteRow(0, 1, 2))
  })

  it('should update coordinates to internal dependency', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
      ['2', '=$A2'],
      ['3', '=A$3'],
      ['4', '=$A$4'],
    ])

    expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.absoluteRow(0, -1, 2))

    engine.moveCells(adr('A1'), 2, 4, adr('B2'))

    expect(extractReference(engine, adr('C2'))).toEqual(CellAddress.relative(0, -1, 0))
    expect(extractReference(engine, adr('C3'))).toEqual(CellAddress.absoluteCol(0, 1, 0))
    expect(extractReference(engine, adr('C4'))).toEqual(CellAddress.absoluteRow(0, -1, 3))
    expect(extractReference(engine, adr('C5'))).toEqual(CellAddress.absolute(0, 1, 4))
  })

  xit('should return #REF when overriding whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1', '2'],
        ['3', '4'],
        ['=SUM(B1:B2)']
    ])

    engine.moveCells(adr("A1"), 1, 2, adr("B1"))

    expect_function_to_have_ref_error(engine, adr("A3"))
  })
})

describe('Move cells', () => {
  it('should move static content', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo'],
      [''],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    expect(engine.getCellValue('A2')).toEqual('foo')
  })

  it('should update reference of moved formula when moving to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['foo'],
        ['=A1'],
      ],
      Sheet2: [
        ['' /* =A1 */],
      ],
    })

    engine.moveCells(adr('A2'), 1, 1, adr('B1', 1))

    expect(extractReference(engine, adr('B1', 1))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('should update reference', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo' /* foo */],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(0, 1, -1))
    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteCol(0, 1, -2))
    expect(extractReference(engine, adr('A4'))).toEqual(CellAddress.absoluteRow(0, 1, 0))
    expect(extractReference(engine, adr('A5'))).toEqual(CellAddress.absolute(0, 1, 0))
  })

  it('value moved has appropriate edges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['foo' /* foo */],
      ['=A1'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    const movedVertex = engine.dependencyGraph.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(movedVertex, engine.dependencyGraph.fetchCell(adr('A2')))).toBe(true)
  })

  it('should update reference when moving to different sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['foo'],
        ['=A1'],
      ],
      Sheet2: [],
    })

    engine.moveCells(adr('A1'), 1, 1, adr('B1', 1))

    const reference = extractReference(engine, adr('A2'))
    expect(reference).toEqual(CellAddress.relative(1, 1, -1))
  })

  it('should override and remove formula', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    expect(engine.graph.edgesCount()).toBe(0)
    expect(engine.graph.nodesCount()).toBe(1)
    expect(engine.getCellValue('A1')).toBe(EmptyValue)
    expect(engine.getCellValue('A2')).toBe(1)
  })

  it('moving empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '42'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(null)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(null)
  })

  it('replacing formula dependency with null one', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '42'],
      ['=B1'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', ''],
      ['=B1'],
    ]))
  })

  it('moving empty vertex to empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', ''],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(null)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(null)
  })

  it('should adjust edges properly', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
      ['2', '=A2'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const b2 = engine.addressMapping.fetchCell(adr('B2'))
    const source = engine.addressMapping.getCell(adr('A1'))
    const target = engine.addressMapping.fetchCell(adr('A2'))

    expect(engine.graph.edgesCount()).toBe(
        2, // A2 -> B1, A2 -> B2
    )
    expect(engine.graph.nodesCount()).toBe(
        +2 // formulas
        + 1, // A2
    )

    expect(source).toBe(null)
    expect(engine.graph.existsEdge(target, b2)).toBe(true)
    expect(engine.graph.existsEdge(target, b1)).toBe(true)
    expect(engine.getCellValue('A2')).toBe(1)
  })
})

describe('moving ranges', () => {
  it('should not update range when only part of it is moved', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1' /* 1 */],
      ['2'],
      ['=SUM(A1:A2)'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B1'))

    const range = extractRange(engine, adr('A3'))
    expect(range.start).toEqual(adr('A1'))
    expect(range.end).toEqual(adr('A2'))
    expect(engine.getCellValue('A3')).toEqual(2)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a1a2 = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, a1a2)).toBe(true)
    expect(engine.graph.existsEdge(a2, a1a2)).toBe(true)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '1'],
      ['2'],
      ['=SUM(A1:A2)'],
    ]))
  })

  it('should update moved range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1' /* 1 */],
      ['2' /* 2 */],
      ['=SUM(A1:A2)'],
    ])

    engine.moveCells(adr('A1'), 1, 2, adr('B1'))

    expect(engine.rangeMapping.getRange(adr('B1'), adr('B2'))).not.toBe(null)

    const range = extractRange(engine, adr('A3'))
    expect(range.start).toEqual(adr('B1'))
    expect(range.end).toEqual(adr('B2'))
    expect(engine.getCellValue('A3')).toEqual(3)

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(null)
    expect(engine.addressMapping.getCell(adr('A2'))).toBe(null)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '1'],
      ['', '2'],
      ['=SUM(B1:B2)'],
    ]))
  })

  it('should not be possible to move area with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.moveCells(adr('A2'), 2, 2, adr('C1'))
    }).toThrow('It is not possible to move / replace cells with matrix')
  })

  it('should not be possible to move cells to area with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.moveCells(adr('A1'), 2, 1, adr('A2'))
    }).toThrow('It is not possible to move / replace cells with matrix')
  })

  it('should adjust edges when moving part of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const b2 = engine.addressMapping.fetchCell(adr('B2'))
    const source = engine.addressMapping.fetchCell(adr('A1'))
    const target = engine.addressMapping.fetchCell(adr('A2'))
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))

    expect(source).toEqual(new EmptyCellVertex())
    expect(source.getCellValue()).toBe(EmptyValue)
    expect(engine.graph.nodesCount()).toBe(
        +2 // formulas
        + 1 // A2
        + 1 // A1 (Empty)
        + 1, // A1:A2 range
    )
    expect(engine.graph.edgesCount()).toBe(
        +2 // A1 (Empty) -> A1:A2, A2 -> A1:A2
        + 1 // A1:A2 -> B1
        + 1, // A2 -> B2
    )
    expect(engine.graph.existsEdge(target, b2)).toBe(true)
    expect(engine.graph.existsEdge(source, range)).toBe(true)
    expect(engine.graph.existsEdge(target, range)).toBe(true)
    expect(engine.graph.existsEdge(range, b1)).toBe(true)
    expect(engine.getCellValue('A2')).toBe(1)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '=SUM(A1:A2)'],
      ['1', '=A2'],
    ]))
  })

  it('should adjust edges when moving whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(adr('A1'), 1, 2, adr('C1'))

    const a1 = engine.addressMapping.getCell(adr('A1'))
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const b2 = engine.addressMapping.fetchCell(adr('B2'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    const c2 = engine.addressMapping.fetchCell(adr('C2'))
    const range = engine.rangeMapping.fetchRange(adr('C1'), adr('C2'))

    expect(a1).toBe(null)
    expect(a2).toBe(null)

    expect(engine.graph.nodesCount()).toBe(
        +2 // formulas
        + 2 // C1, C2
        + 1, // C1:C2 range
    )
    expect(engine.graph.edgesCount()).toBe(
        +2 // C1 -> C1:C2, C2 -> C1:C2
        + 1 // C1:C2 -> B1
        + 1, // C2 -> B2
    )

    expect(engine.graph.existsEdge(c1, range)).toBe(true)
    expect(engine.graph.existsEdge(c2, range)).toBe(true)
    expect(engine.graph.existsEdge(range, b1)).toBe(true)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '=SUM(C1:C2)', '1'],
      ['', '=C2', '2'],
    ]))
  })

  it('should adjust edges when moving smaller range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''            /* 1 */],
      ['2', '=SUM(A1:A2)' /* 2 */],
      ['3', '=SUM(A1:A3)'],
    ])

    engine.moveCells(adr('A1'), 1, 2, adr('C1'))

    /* ranges in formulas*/
    expect(extractRange(engine, adr('B2'))).toEqual(new AbsoluteCellRange(
        adr('C1'),
        adr('C2'),
    ))
    expect(extractRange(engine, adr('B3'))).toEqual(new AbsoluteCellRange(
        adr('A1'),
        adr('A3'),
    ))

    /* edges */
    const c1c2 = engine.rangeMapping.fetchRange(adr('C1'), adr('C2'))
    const a1a3 = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    expect(engine.graph.existsEdge(c1c2, a1a3)).toBe(false)

    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A1')), a1a3)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A2')), a1a3)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A3')), a1a3)).toBe(true)

    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('C1')), c1c2)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('C2')), c1c2)).toBe(true)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '', '1'],
      ['', '=SUM(C1:C2)', '2'],
      ['3', '=SUM(A1:A3)'],
    ]))
  })

  it('should adjust edges when moving smaller ranges - more complex', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''            /* 1 */],
      ['2', '=SUM(A1:A2)' /* 2 */],
      ['3', '=SUM(A1:A3)'  /* 3 */],
      ['4', '=SUM(A1:A4)'],
    ])

    engine.moveCells(adr('A1'), 1, 3, adr('C1'))

    /* edges */
    const c1c2 = engine.rangeMapping.fetchRange(adr('C1'), adr('C2'))
    const c1c3 = engine.rangeMapping.fetchRange(adr('C1'), adr('C3'))
    const a1a4 = engine.rangeMapping.fetchRange(adr('A1'), adr('A4'))

    expect(engine.graph.existsEdge(c1c2, c1c3)).toBe(true)
    expect(engine.graph.existsEdge(c1c3, a1a4)).toBe(false)

    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A1')), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A2')), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A3')), a1a4)).toBe(true)
    expect(engine.graph.existsEdge(engine.addressMapping.fetchCell(adr('A4')), a1a4)).toBe(true)

    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    const c2 = engine.addressMapping.fetchCell(adr('C2'))
    const c3 = engine.addressMapping.fetchCell(adr('C3'))
    expect(engine.graph.existsEdge(c1, c1c2)).toBe(true)
    expect(engine.graph.existsEdge(c2, c1c2)).toBe(true)
    expect(engine.graph.existsEdge(c1, c1c3)).toBe(false)
    expect(engine.graph.existsEdge(c2, c1c3)).toBe(false)
    expect(engine.graph.existsEdge(c3, c1c3)).toBe(true)

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '', '1'],
      ['', '=SUM(C1:C2)', '2'],
      ['', '=SUM(C1:C3)', '3'],
      ['4', '=SUM(A1:A4)'],
    ]))
  })

  it('move wider dependent ranges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B1)', '=SUM(A1:B2)', '=SUM(A1:B3)'],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('C1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '', '1', '2'],
      ['', '', '3', '4'],
      ['5', '6'],
      ['=SUM(C1:D1)', '=SUM(C1:D2)', '=SUM(A1:B3)'],
    ]))
  })
})

describe('overlapping areas', () => {
  it('overlapped rows', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('A2'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', ''],
      ['1', '2'],
      ['3', '4'],
    ]))
  })

  it('overlapped rows - oposit way', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ])

    engine.moveCells(adr('A2'), 2, 2, adr('A1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['3', '4'],
      ['5', '6'],
      ['', ''],
    ]))
  })

  it('overlapped columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('B1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '1', '2'],
      ['', '4', '5'],
    ]))
  })

  it('overlapped columns - oposit way', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(adr('B1'), 2, 2, adr('A1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['2', '3', ''],
      ['5', '6', ''],
    ]))
  })

  it('moving along diagonal', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(adr('A1'), 3, 2, adr('B2'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '', '', ''],
      ['', '1', '2', '3'],
      ['', '4', '5', '6'],
    ]))
  })

  it('overlapped rows with ranges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B2)', '=SUM(A1:B3)', '=SUM(A2:B2)'],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('A2'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', ''],
      ['1', '2'],
      ['3', '4'],
      ['=SUM(A2:B3)', '=SUM(A1:B3)', '=SUM(A3:B3)'],
    ]))
  })

  it('overlapped columns with ranges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['=SUM(A1:B2)', '=SUM(A1:C2)', '=SUM(B1:B2)'],
    ])

    engine.moveCells(adr('A1'), 2, 2, adr('B1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '1', '2'],
      ['', '4', '5'],
      ['=SUM(B1:C2)', '=SUM(A1:C2)', '=SUM(C1:C2)'],
    ]))
  })

  it('expecting range to be same when moving part of a range inside this range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      [''],
      ['1'],
      ['3'],
      ['=SUM(A1:A3)'],
    ]))
  })

  it('expecting range to be same when moving part of a range outside of this range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      [''],
      ['=SUM(A1:A3)'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A4'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      [''],
      ['2'],
      ['3'],
      ['1'],
      ['=SUM(A1:A3)'],
    ]))
  })

  it('expecting range to be same when moving part of a range outside of this range - row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', ''],
      ['=SUM(A1:C1)'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('D1'))

    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([
      ['', '2', '3', '1'],
      ['=SUM(A1:C1)'],
    ]))
  })

  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.moveCells(simpleCellAddress(0, 0, 0), 2, 2, simpleCellAddress(0, 2, 0))

    expect(extractMatrixRange(engine, adr('A3'))).toEqual(new AbsoluteCellRange(adr('C1'), adr('D2')))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4'],
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
      ],
    })

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))

    engine.moveCells(simpleCellAddress(0, 0, 0), 2, 2, simpleCellAddress(0, 2, 0))

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('C1'), adr('D2')))
  })
})

describe('column index', () => {
  xit('should update column index when moving cell', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1'],
        ['=VLOOKUP(1, A1:A1, 1, TRUE())']
    ], new Config({ useColumnIndex: true }))

    engine.moveCells(adr("A1"), 1, 1, adr("B1"))

    const index = engine.columnSearch as ColumnIndex
    expect_array_with_same_content([0], index.getValueIndex(0, 1, 1).index)
  })

  xit('should update column index when moving cell - more complex example', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['=VLOOKUP(1, A1:A1, 1, TRUE())']
    ], new Config({ useColumnIndex: true }))

    engine.moveCells(adr("A1"), 1, 1, adr("B1"))

    const index = engine.columnSearch as ColumnIndex
    expect_array_with_same_content([0], index.getValueIndex(0, 1, 1).index)
  })

  xit('should update column index when moving cell - overal', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['=VLOOKUP(1, A1:A1, 1, TRUE())']
    ], new Config({ useColumnIndex: true }))

    engine.moveCells(adr("A1"), 1, 1, adr("B1"))

    const index = engine.columnSearch as ColumnIndex
    expect_array_with_same_content([0], index.getValueIndex(0, 1, 1).index)
  })
})
