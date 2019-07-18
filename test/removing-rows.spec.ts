import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {MatrixVertex, RangeVertex} from '../src/DependencyGraph'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'
import {expect_function_to_have_ref_error, expect_reference_to_have_ref_error, extractReference} from './testUtils'

describe('Removing rows - dependencies', () => {
  it('should not affect absolute dependencies to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1'], // rows to delete
        ['2'], //
        ['=$Sheet2.A$1'],
      ],
      Sheet2: [
        ['3'],
        ['4'],
      ],
    })

    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.absoluteRow(1, 0, 0))
    engine.removeRows(0, 0, 1)
    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteRow(1, 0, 0))
  })

  it('same sheet, case Aa', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      ['1'],
      [''], // row to delete
      ['=A$2'],
    ])

    engine.removeRows(0, 2)

    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.absoluteRow(0, 0, 1))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A$3'],
      [''], // row to delete
      ['42'],
    ])

    engine.removeRows(0, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteRow(0, 0, 1))
  })

  it('same sheet, case Ac', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A$2'],
      [''], // row to delete
    ])

    engine.removeRows(0, 1)

    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      ['=A1'],
      ['2'],
    ])

    engine.removeRows(0, 2, 2)

    expect(extractReference(engine, simpleCellAddress(0, 0, 1))).toEqual(CellAddress.relative(0, 0, -1))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      ['1'],
      ['2'],
      ['=A1'],
    ])

    engine.removeRows(0, 1, 2)

    expect(extractReference(engine, simpleCellAddress(0, 0, 1))).toEqual(CellAddress.relative(0, 0, -1))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A4'],
      ['1'],
      ['2'],
      ['42'],
    ])

    engine.removeRows(0, 1, 2)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['=A4'],
      ['42'],
    ])

    engine.removeRows(0, 0, 1)
    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('same sheet, case Rca', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A3'],
      ['1'],
      ['2'],
      ['3'],
    ])

    engine.removeRows(0, 1, 2)
    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })

  it('same sheet, case Rcb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=A2'],
    ])

    engine.removeRows(0, 0, 1)
    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 1))
  })

  it('same sheet, case Rca, range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=SUM(A2:A3)'],
      ['1'],
      ['2'],
    ])
    engine.removeRows(0, 1, 2)
    expect_function_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })
})

describe('Removing rows - matrices', () => {
  it('should not remove row with formula matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=MMULT(A1:B2, A1:B2)}'],
    ])

    expect(() => engine.removeRows(0, 2, 2)).toThrowError('It is not possible to remove row with matrix')
  })

  it('should remove row from numeric matrix', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    engine.removeRows(0, 1, 1)

    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })

  it('should remove rows when partial overlap', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    engine.removeRows(0, 1, 3)
    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })

  it('should remove MatrixVertex completely from graph', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeRows(0, 0, 1)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(1)
  })

  it('should remove MatrixVertex completely from graph, more rows', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['foo', 'bar'],
    ], config)

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeRows(0, 0, 2)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(1)
  })
})

describe('Removing rows - graph', function() {
  it('should remove vertices from graph', function() {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(5)
    engine.removeRows(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(1) // only empty vertex left
  })
})

describe('Removing rows - ranges', function() {
  it('shift ranges in range mapping, range start below removed rows', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      ['2', '=SUM(A2:A3)'],
      ['3', ''],
    ])

    engine.removeRows(0, 0, 0)
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 1))!
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start above removed rows', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
    ])

    engine.removeRows(0, 1, 2)
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 0))!
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])

    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2)) as RangeVertex
    engine.removeRows(0, 0, 2)
    const ranges = Array.from(engine.rangeMapping.getValues())
    expect(ranges.length).toBe(0)
    expect(engine.graph.hasNode(range)).toBe(false)
  })

  it('should remove smaller range dependency', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])

    const a1a3 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2)) as RangeVertex
    expect(engine.graph.getDependecies(a1a3).length).toBe(2)
    engine.removeRows(0, 0, 1)
    const a1a1 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 0)) as RangeVertex
    expect(a1a1).toBe(a1a3)
    expect(engine.graph.getDependecies(a1a1).length).toBe(1)
  })
})
