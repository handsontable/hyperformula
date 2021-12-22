import {ErrorType, HyperFormula} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {EmptyCellVertex, FormulaCellVertex} from '../../src/DependencyGraph'
import {SheetSizeLimitExceededError} from '../../src/errors'
import {EmptyValue} from '../../src/interpreter/InterpreterValue'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {CellAddress} from '../../src/parser'
import {
  adr,
  colEnd,
  colStart,
  detailedError,
  expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  extractColumnRange,
  extractMatrixRange,
  extractRange,
  extractReference,
  extractRowRange,
  rowEnd,
  rowStart,
} from '../testUtils'

describe('Moving rows - checking if its possible', () => {
  it('source top left corner should have valid coordinates', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(simpleCellAddress(0, -1, 0), 1, 1), adr('A2'))).toEqual(false)
  })

  it('source top left corner should be in existing sheet', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1', 1), 1, 1), adr('A2'))).toEqual(false)
  })

  it('target top left corner should have valid coordinates', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), simpleCellAddress(0, -1, 0))).toEqual(false)
  })

  it('target top left corner should be in existing sheet', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2', 1))).toEqual(false)
  })

  it('no if we move the range which overlaps with matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
      [],
      ['13'],
    ])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2), adr('A10'))).toBe(false)
  })

  it('no if we move to range which overlaps with matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
      [],
      ['13'],
    ])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('B2'))).toBe(false)
  })

  it('no if we move beyond sheet size limits ', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns - 1, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows - 1)
    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), cellInLastColumn)).toEqual(true)
    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1), cellInLastColumn)).toEqual(false)
    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), cellInLastRow)).toEqual(true)
    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), cellInLastRow)).toEqual(false)
  })

  it('yes otherwise', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToMoveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))).toBe(true)
  })
})

describe('Address dependencies, moved formulas', () => {
  it('should update dependency to external cell when not overriding it', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo'],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 1, 4), adr('B1'))

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.absoluteCol(0, -1))
    expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.absoluteRow(-1, 0))
    expect(extractReference(engine, adr('B4'))).toEqual(CellAddress.absolute(0, 0))
  })

  it('should return #CYCLE when overriding referred dependency to external cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B1', '1'],
      ['=$B2', '2'],
      ['=B$3', '3'],
      ['=$B$4', '4'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 4), adr('B1'))

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B3'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B4'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellFormula(adr('B1'))).toEqual('=B1')
    expect(engine.getCellFormula(adr('B2'))).toEqual('=$B2')
    expect(engine.getCellFormula(adr('B3'))).toEqual('=B$3')
    expect(engine.getCellFormula(adr('B4'))).toEqual('=$B$4')
  })

  it('should work when overriding moved dependency', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B2', '1'],
      ['3', '2'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('B1'))

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
  })

  it('should update internal dependency when overriding dependent cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B$2', null],
      [null, null],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('B2'))

    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.absoluteRow(1, 2))
  })

  it('should update coordinates to internal dependency', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
      ['2', '=$A2'],
      ['3', '=A$3'],
      ['4', '=$A$4'],
    ])

    expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.absoluteRow(-1, 2))

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 4), adr('B2'))

    expect(extractReference(engine, adr('C2'))).toEqual(CellAddress.relative(0, -1))
    expect(extractReference(engine, adr('C3'))).toEqual(CellAddress.absoluteCol(1, 0))
    expect(extractReference(engine, adr('C4'))).toEqual(CellAddress.absoluteRow(-1, 3))
    expect(extractReference(engine, adr('C5'))).toEqual(CellAddress.absolute(1, 4))
  })

  it('should evaluate formula when overriding external formula dependency', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(B1:B2)'],
      ['=B3'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 3), adr('B1'))

    expect(engine.getCellValue(adr('A4'))).toEqual(4)
    expect(engine.getCellValue(adr('A5'))).toEqual(5)
  })
})

describe('Move cells', () => {
  it('should move static content', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo'],
      [null],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.getCellValue(adr('A2'))).toEqual('foo')
  })

  it('should update reference of moved formula when moving to other sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['foo'],
        ['=A1'],
      ],
      Sheet2: [
        [null /* =A1 */],
      ],
    })

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 1, 1), adr('B1', 1))

    expect(extractReference(engine, adr('B1', 1))).toEqual(CellAddress.relative(0, -1))
  })

  it('should update address in vertex', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['foo'],
        ['=A1'],
      ],
      Sheet2: [
        [null /* =A1 */],
      ],
    })

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 1, 1), adr('B1', 1))

    const vertex = engine.dependencyGraph.fetchCell(adr('B1', 1)) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('B1', 1))
  })

  it('should update reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo' /* foo */],
      ['=A1'],
      ['=$A1'],
      ['=A$1'],
      ['=$A$1'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(-1, 1))
    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteCol(1, -2))
    expect(extractReference(engine, adr('A4'))).toEqual(CellAddress.absoluteRow(1, 0))
    expect(extractReference(engine, adr('A5'))).toEqual(CellAddress.absolute(1, 0))
  })

  it('value moved has appropriate edges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo' /* foo */],
      ['=A1'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    const movedVertex = engine.dependencyGraph.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(movedVertex, engine.dependencyGraph.fetchCell(adr('A2')))).toBe(true)
  })

  it('should update reference when moving to different sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['foo'],
        ['=A1'],
      ],
      Sheet2: [],
    })

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1', 1))

    const reference = extractReference(engine, adr('A2'))
    expect(reference).toEqual(CellAddress.relative(-1, 1))
  })

  it('should override and remove formula', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.graph.edgesCount()).toBe(0)
    expect(engine.graph.nodesCount()).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe(null)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
  })

  it('moving empty vertex', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '42'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(undefined)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(undefined)
  })

  it('replacing formula dependency with null one', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '42'],
      ['=B1'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null],
      ['=B1'],
    ])[0])
  })

  it('moving empty vertex to empty vertex', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(undefined)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(undefined)
  })

  it('should adjust edges properly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
      ['2', '=A2'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

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

    expect(source).toBe(undefined)
    expect(engine.graph.existsEdge(target, b2)).toBe(true)
    expect(engine.graph.existsEdge(target, b1)).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
  })

  it('should throw error trying to move cells beyond sheet limits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns - 1, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows - 1)

    expect(() => engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1), cellInLastColumn)).toThrow(new SheetSizeLimitExceededError())
    expect(() => engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), cellInLastRow)).toThrow(new SheetSizeLimitExceededError())
  })
})

describe('moving ranges', () => {
  it('should not update range when only part of it is moved', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1' /* 1 */],
      ['2'],
      ['=SUM(A1:A2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    const range = extractRange(engine, adr('A3'))
    expect(range.start).toEqual(adr('A1'))
    expect(range.end).toEqual(adr('A2'))
    expect(engine.getCellValue(adr('A3'))).toEqual(2)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a1a2 = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, a1a2)).toBe(true)
    expect(engine.graph.existsEdge(a2, a1a2)).toBe(true)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '1'],
      ['2'],
      ['=SUM(A1:A2)'],
    ])[0])
  })

  it('should update moved range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1' /* 1 */],
      ['2' /* 2 */],
      ['=SUM(A1:A2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('B1'))

    expect(engine.rangeMapping.getRange(adr('B1'), adr('B2'))).not.toBe(undefined)

    const range = extractRange(engine, adr('A3'))
    expect(range.start).toEqual(adr('B1'))
    expect(range.end).toEqual(adr('B2'))
    expect(engine.getCellValue(adr('A3'))).toEqual(3)

    expect(engine.addressMapping.getCell(adr('A1'))).toBe(undefined)
    expect(engine.addressMapping.getCell(adr('A2'))).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '1'],
      [null, '2'],
      ['=SUM(B1:B2)'],
    ])[0])
  })

  it('should not be possible to move area with matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(() => {
      engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 2, 2), adr('C1'))
    }).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should not be possible to move cells to area with matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(() => {
      engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1), adr('A2'))
    }).toThrowError('Cannot perform this operation, target location has an array inside.')
  })

  it('should adjust edges when moving part of range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const b2 = engine.addressMapping.fetchCell(adr('B2'))
    const source = engine.addressMapping.fetchCell(adr('A1'))
    const target = engine.addressMapping.fetchCell(adr('A2'))
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))

    expect(source).toBeInstanceOf(EmptyCellVertex)
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
    expect(engine.getCellValue(adr('A2'))).toBe(1)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '=SUM(A1:A2)'],
      ['1', '=A2'],
    ])[0])
  })

  it('should adjust edges when moving whole range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A2)'],
      ['2', '=A2'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('C1'))

    const a1 = engine.addressMapping.getCell(adr('A1'))
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    const c2 = engine.addressMapping.fetchCell(adr('C2'))
    const range = engine.rangeMapping.fetchRange(adr('C1'), adr('C2'))

    expect(a1).toBe(undefined)
    expect(a2).toBe(undefined)

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

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '=SUM(C1:C2)', '1'],
      [null, '=C2', '2'],
    ])[0])
  })

  it('should adjust edges when moving smaller range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null            /* 1 */],
      ['2', '=SUM(A1:A2)' /* 2 */],
      ['3', '=SUM(A1:A3)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('C1'))

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

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null, '1'],
      [null, '=SUM(C1:C2)', '2'],
      ['3', '=SUM(A1:A3)'],
    ])[0])
  })

  it('should adjust edges when moving smaller ranges - more complex', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null            /* 1 */],
      ['2', '=SUM(A1:A2)' /* 2 */],
      ['3', '=SUM(A1:A3)'  /* 3 */],
      ['4', '=SUM(A1:A4)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 3), adr('C1'))

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

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null, '1'],
      [null, '=SUM(C1:C2)', '2'],
      [null, '=SUM(C1:C3)', '3'],
      ['4', '=SUM(A1:A4)'],
    ])[0])
  })

  it('move wider dependent ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B1)', '=SUM(A1:B2)', '=SUM(A1:B3)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('C1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null, '1', '2'],
      [null, null, '3', '4'],
      ['5', '6'],
      ['=SUM(C1:D1)', '=SUM(C1:D2)', '=SUM(A1:B3)'],
    ])[0])
  })
})

describe('overlapping areas', () => {
  it('overlapped rows', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('A2'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null],
      ['1', '2'],
      ['3', '4'],
    ])[0])
  })

  it('overlapped rows - opposite way', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 2, 2), adr('A1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['3', '4'],
      ['5', '6'],
      [null, null],
    ])[0])
  })

  it('overlapped columns', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('B1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '1', '2'],
      [null, '4', '5'],
    ])[0])
  })

  it('overlapped columns - opposite way', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('B1'), 2, 2), adr('A1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['2', '3', null],
      ['5', '6', null],
    ])[0])
  })

  it('moving along diagonal', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 3, 2), adr('B2'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null, null, null],
      [null, '1', '2', '3'],
      [null, '4', '5', '6'],
    ])[0])
  })

  it('overlapped rows with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B2)', '=SUM(A1:B3)', '=SUM(A2:B2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('A2'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null],
      ['1', '2'],
      ['3', '4'],
      ['=SUM(A2:B3)', '=SUM(A1:B3)', '=SUM(A3:B3)'],
    ])[0])
  })

  it('overlapped columns with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['=SUM(A1:B2)', '=SUM(A1:C2)', '=SUM(B1:B2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('B1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '1', '2'],
      [null, '4', '5'],
      ['=SUM(B1:C2)', '=SUM(A1:C2)', '=SUM(C1:C2)'],
    ])[0])
  })

  it('expecting range to be same when moving part of a range inside this range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null],
      ['1'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])[0])
  })

  it('expecting range to be same when moving part of a range outside of this range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      [null],
      ['=SUM(A1:A3)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A4'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null],
      ['2'],
      ['3'],
      ['1'],
      ['=SUM(A1:A3)'],
    ])[0])
  })

  it('expecting range to be same when moving part of a range outside of this range - row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3', null],
      ['=SUM(A1:C1)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('D1'))

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, '2', '3', '1'],
      ['=SUM(A1:C1)'],
    ])[0])
  })

  it('ArrayVertex#formula should be updated', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('C1', 0))

    expect(extractMatrixRange(engine, adr('A3'))).toEqual(new AbsoluteCellRange(adr('C1'), adr('D2')))
  })

  it('ArrayVertex#formula should be updated when different sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4'],
      ],
      Sheet2: [
        ['=TRANSPOSE(Sheet1!A1:B2)'],
      ],
    })

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('C1', 0))

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('C1'), adr('D2')))
  })

  it('overlapped formulas', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2'],
      ['42']
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null],
      ['=A2']
    ])[0])
  })

  it('overlapped formula with range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2:B2'],
      ['42']
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null],
      ['=A2:B2']
    ])[0])
  })
})

describe('column index', () => {
  it('should update column index when moving cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['1'],
      ['=VLOOKUP(1, A1:A2, 1, TRUE())'],
    ], {useColumnIndex: true})

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B1'))

    const index = engine.columnSearch as ColumnIndex
    expectArrayWithSameContent([1, 2], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([0], index.getValueIndex(0, 1, 1).index)
  })

  it('should update column index when moving cell - REFs', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B1', '1'],
      ['3', '2'],
    ], {useColumnIndex: true})

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2), adr('B1'))

    const index = engine.columnSearch as ColumnIndex
    expectArrayWithSameContent([], index.getValueIndex(0, 0, 2).index)
    expectArrayWithSameContent([], index.getValueIndex(0, 0, 3).index)
    expectArrayWithSameContent([], index.getValueIndex(0, 1, 1).index)
    expectArrayWithSameContent([], index.getValueIndex(0, 1, 2).index)
    expectArrayWithSameContent([1], index.getValueIndex(0, 1, 3).index)
  })

  it('should update column index when source and target overlaps', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '5'],
      [null, '6', '7'],
    ], {useColumnIndex: true})

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2), adr('B2'))

    const index = engine.columnSearch as ColumnIndex
    expect(index.getColumnMap(0, 0).size).toEqual(0)
    expect(index.getColumnMap(0, 1).size).toEqual(2)
    expectArrayWithSameContent([1], index.getValueIndex(0, 1, 1).index)
    expectArrayWithSameContent([2], index.getValueIndex(0, 1, 3).index)
    expect(index.getColumnMap(0, 2).size).toEqual(2)
    expectArrayWithSameContent([1], index.getValueIndex(0, 2, 2).index)
    expectArrayWithSameContent([2], index.getValueIndex(0, 2, 4).index)
  })

  it('should update column index when source and target overlaps - oposite way', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '5'],
      [null, '6', '7'],
    ], {useColumnIndex: true})

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), adr('A1'))

    const index = engine.columnSearch as ColumnIndex
    expect(index.getColumnMap(0, 0).size).toEqual(2)
    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 4).index)
    expectArrayWithSameContent([1], index.getValueIndex(0, 0, 6).index)
    expect(index.getColumnMap(0, 0).size).toEqual(2)
    expectArrayWithSameContent([0], index.getValueIndex(0, 1, 5).index)
    expectArrayWithSameContent([1], index.getValueIndex(0, 1, 7).index)
    expect(index.getColumnMap(0, 2).size).toEqual(0)
  })
})

describe('move cells with matrices', () => {
  it('should not be possible to move part of formula matrix', function() {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(() => {
      engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 1, 1), adr('A3'))
    }).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should not be possible to move formula matrix at all', function() {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(() => {
      engine.moveCells(AbsoluteCellRange.spanFrom(adr('A2'), 2, 1), adr('A3'))
    }).toThrowError('Cannot perform this operation, source location has an array inside.')
  })
})

describe('cell ranges', () => {
  it('should transform relative references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, '=SUM(A1:B1)', '=SUM($A1:B$1)', '=SUM(A$1:$B$1)']])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('C1'), 3, 1), adr('D2'))

    expect(engine.getCellFormula(adr('D2'))).toEqual('=SUM(A1:B1)')
    expect(engine.getCellFormula(adr('E2'))).toEqual('=SUM($A1:B$1)')
    expect(engine.getCellFormula(adr('F2'))).toEqual('=SUM(A$1:$B$1)')
  })

  it('move formula and one end of a range', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)']
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('B1'), 1, 2), adr('C1'))

    expect(engine.getCellFormula(adr('C2'))).toEqual('=SUM(A1:B1)')
  })

  it('should be #CYCLE! if one of ends is in target range', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, '=SUM(A1:B1)']])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('C1'), 1, 1), adr('B1'))

    expect(engine.getCellFormula(adr('B1'))).toEqual('=SUM(A1:B1)')
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})

describe('column ranges', () => {
  it('should not update range when only part of it is moved', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '3', '=SUM(A:B)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('C2'))

    const range = extractColumnRange(engine, adr('C1'))
    expect(range.start).toEqual(colStart('A'))
    expect(range.end).toEqual(colEnd('B'))
    expect(engine.getCellValue(adr('C1'))).toEqual(3)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const ab = engine.rangeMapping.fetchRange(colStart('A'), colEnd('B'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, ab)).toBe(true)
    expect(engine.graph.existsEdge(b1, ab)).toBe(true)
  })

  it('should transform relative column references', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(C:D)', '', '1', '2']
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B2'))

    const range = extractColumnRange(engine, adr('B2'))
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(range.start).toEqual(colStart('C'))
    expect(range.end).toEqual(colEnd('D'))
  })

  it('should be #CYCLE! if one of ends is in target range', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, '=SUM(A:B)']])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('C1'), 1, 1), adr('B1'))

    expect(engine.getCellFormula(adr('B1'))).toEqual('=SUM(A:B)')
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})

describe('row ranges', () => {
  it('should not update range when only part of it is moved', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['3'],
      ['=SUM(1:2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B3'))

    const range = extractRowRange(engine, adr('A3'))
    expect(range.start).toEqual(rowStart(1))
    expect(range.end).toEqual(rowEnd(2))
    expect(engine.getCellValue(adr('A3'))).toEqual(3)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const ab = engine.rangeMapping.fetchRange(rowStart(1), rowEnd(2))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, ab)).toBe(true)
    expect(engine.graph.existsEdge(a2, ab)).toBe(true)
  })

  it('should transform relative column references', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(3:4)'],
      [null],
      ['1'],
      ['2'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('B2'))

    const range = extractRowRange(engine, adr('B2'))
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(range.start).toEqual(rowStart(3))
    expect(range.end).toEqual(rowEnd(4))
  })

  it('should be #CYCLE! if one of ends is in target range', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1],
      [2],
      ['=SUM(1:2)'],
    ])

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A3'), 1, 1), adr('A2'))

    expect(engine.getCellFormula(adr('A2'))).toEqual('=SUM(1:2)')
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})
