import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {MatrixVertex, RangeVertex} from '../src/DependencyGraph'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {extractRange, extractMatrixRange, adr, expect_function_to_have_ref_error, expect_reference_to_have_ref_error, extractReference} from './testUtils'

describe('Removing rows - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A3)'],
      [''], // deleted
      ['3'],
    ])

    expect(engine.getCellValue('B1')).toEqual(1)
    engine.removeRows(0, 1, 1)
    expect(engine.getCellValue('B1')).toEqual(0)
  })

  it('dont reevaluate everything', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A3)', '=SUM(A1:A1)'],
      [''], // deleted
      ['3'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const b1setCellValueSpy = jest.spyOn(b1 as any, 'setCellValue')
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.removeRows(0, 1, 1)

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=COLUMNS(A1:B1)'],
      ['1'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.removeRows(0, 1, 1)

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })
})

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

    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteRow(1, 0, 0))
    engine.removeRows(0, 0, 1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(1, 0, 0))
  })

  it('same sheet, case Aa', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      ['1'],
      [''], // row to delete
      ['=A$2'],
    ])

    engine.removeRows(0, 2)

    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteRow(0, 0, 1))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A$3'],
      [''], // row to delete
      ['42'],
    ])

    engine.removeRows(0, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(0, 0, 1))
  })

  it('same sheet, case Ac', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A$2'],
      [''], // row to delete
    ])

    engine.removeRows(0, 1)

    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      ['=A1'],
      ['2'],
    ])

    engine.removeRows(0, 2, 2)

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(0, 0, -1))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      ['1'],
      ['2'],
      ['=A1'],
    ])

    engine.removeRows(0, 1, 2)

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(0, 0, -1))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A4'],
      ['1'],
      ['2'],
      ['42'],
    ])

    engine.removeRows(0, 1, 2)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['=A4'],
      ['42'],
    ])

    engine.removeRows(0, 0, 1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('same sheet, case Rca', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A3'],
      ['1'],
      ['2'],
      ['3'],
    ])

    engine.removeRows(0, 1, 2)
    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('same sheet, case Rcb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=A2'],
    ])

    engine.removeRows(0, 0, 1)
    expect_reference_to_have_ref_error(engine, adr('A2'))
  })

  it('same sheet, case Rca, range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=SUM(A2:A3)'],
      ['1'], // 
      ['2'], //
    ])
    engine.removeRows(0, 1, 2)
    expect_function_to_have_ref_error(engine, adr('A1'))
  })

  it('truncates range by one row from top if topmost row removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A3)'],
      ['1'],
      ['2'],
    ])

    engine.removeRows(0, 1, 1)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A2')))
  })

  it('truncates range by one row from bottom if last row removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A3)'],
      ['1'],
      ['2'],
    ])

    engine.removeRows(0, 2, 2)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A2')))
  })

  it('truncates range by rows from top if topmost rows removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5']
    ])

    engine.removeRows(0, 1, 2)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from top if topmost rows removed - removing does not have to start with range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A3:A6)'],
      [''],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
    ])

    engine.removeRows(0, 1, 3)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from top if topmost rows removed - removing does not have to start with range but may end on start', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A3:A6)'],
      [''],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
    ])

    engine.removeRows(0, 1, 2)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A4')))
  })

  it('truncates range by rows from bottom if bottomest rows removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.removeRows(0, 3, 4)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from bottom if bottomest rows removed - removing does not have to end with range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      [''],
    ])

    engine.removeRows(0, 3, 5)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from bottom if bottomest rows removed - removing does not have to end with range but may start on end', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      [''],
    ])

    engine.removeRows(0, 4, 5)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A4')))
  })

  it('does not truncate any ranges if rows are removed from different sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['', '=SUM(A2:A3)'],
        ['2'],
        ['3'],
      ],
      Sheet2: [
        ['1']
      ],
    })

    engine.removeRows(1, 1, 1)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
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

    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
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
    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
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
    expect(engine.graph.nodes.size).toBe(0)
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
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('does not remove matrix vertices from graph', function() {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['1', '2'],
      ['1', '2'],
    ], config)
    expect(engine.graph.nodes.size).toBe(1)
    engine.removeRows(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(1)
  })

  it('reevaluates cells dependent on matrix vertex', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=SUM(A1:B3)'],
      ['1', '2'],
      ['1', '2'],
    ], config)

    engine.removeRows(0, 1, 1)

    expect(engine.getCellValue('C1')).toEqual(6)
  })

  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
    ])

    engine.removeRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A3'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
    ])

    engine.removeRows(0, 1, 1)

    const matrixVertex = engine.addressMapping.fetchCell(adr('A3')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('A3'))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '4'],
        ['2', '5'],
        ['3', '6'],
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:B3)}', '{=TRANSPOSE($Sheet1.A1:B3)}'],
        ['{=TRANSPOSE($Sheet1.A1:B3)}', '{=TRANSPOSE($Sheet1.A1:B3)}'],
      ]
    })

    engine.removeRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })
})

describe('Removing rows - graph', function() {
  it('should remove edges from other cells to removed nodes', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['=A2'], //
    ])

    engine.removeRows(0, 2, 2)

    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    expect(engine.graph.adjacentNodes(a2)).toEqual(new Set())
  })

  it('should remove vertices from graph', function() {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(4)
    engine.removeRows(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('works if there are empty cells removed', function() {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      [''],
      ['3'],
    ])
    expect(engine.graph.nodes.size).toBe(2)
    engine.removeRows(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(2)
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
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start above removed rows', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
    ])

    engine.removeRows(0, 1, 2)
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    engine.removeRows(0, 0, 2)
    const ranges = Array.from(engine.rangeMapping.rangesInSheet(0))
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

    const a1a3 = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    expect(engine.graph.getDependencies(a1a3).length).toBe(2)
    engine.removeRows(0, 0, 1)
    const a1a1 = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    expect(a1a1).toBe(a1a3)
    expect(engine.graph.getDependencies(a1a1).length).toBe(1)
  })
})
