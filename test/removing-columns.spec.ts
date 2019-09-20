import {Config, HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {MatrixVertex, RangeVertex} from '../src/DependencyGraph'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'
import {adr, expect_function_to_have_ref_error, expect_reference_to_have_ref_error, extractMatrixRange, extractRange, extractReference} from './testUtils'

describe('Address dependencies, Case 1: same sheet', () => {
  it('case Aa: absolute dependency before removed column should not be affected', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['', '1', '', '=$B1'],
    ])

    engine.removeColumns(0, 2)

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('case Ab: absolute dependency after removed column should be shifted', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$C1', '', '42'],
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('case Ac: absolute dependency in removed column range should be replaced by #REF', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$B1', ''],
    ])

    engine.removeColumns(0, 1)

    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('case Raa: relative dependency and formula before removed columns should not be affected', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '=A1', '2'],
    ])

    engine.removeColumns(0, 2, 2)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('case Rab: relative address should be shifted when only formula is moving', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '1', '2', '=A1'],
    ])

    engine.removeColumns(0, 1, 2)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('case Rba: relative address should be shifted when only dependency is moving', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=D1', '1', '2', '42'],
    ])

    engine.removeColumns(0, 1, 2)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('case Rbb: relative address should not be affected when dependency and formula is moving', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=D1', '42'],
    ])

    engine.removeColumns(0, 0, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('case Rca: relative dependency in deleted column range should be replaced by #REF', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=C1', '1', '2', '3'],
    ])

    engine.removeColumns(0, 1, 2)

    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('case Rcb: relative dependency in deleted column range should be replaced by #REF', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '=B1'],
    ])

    engine.removeColumns(0, 0, 1)

    expect_reference_to_have_ref_error(engine, adr('B1'))
  })

  it('case Rca, range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=SUM(B1:C1)', '1' , '2'],
    ])

    engine.removeColumns(0, 1, 2)

    expect_function_to_have_ref_error(engine, adr('A1'))
  })

  it('truncates range by one column from left if first column removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    engine.removeColumns(0, 0, 0)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('A1')))
  })

  it('truncates range by one column from right if last column removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    engine.removeColumns(0, 1, 1)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('A1')))
  })

  it('truncates range by columns from left if leftmost columns removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '2', '3', '4'],
      ['=SUM(B1:E1)'],
    ])

    engine.removeColumns(0, 1, 2)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from left if leftmost columns removed - removing does not have to start with range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '', '1', '2', '3', '4'],
      ['=SUM(C1:F1)'],
    ])

    engine.removeColumns(0, 1, 3)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from left if leftmost columns removed - removing does not have to start with range but may end on start', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '', '1', '2', '3', '4'],
      ['=SUM(C1:F1)'],
    ])

    engine.removeColumns(0, 1, 2)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('D1')))
  })

  it('truncates range by columns from right if rightmost columns removed', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '2', '3', '4'],
      ['=SUM(B1:E1)'],
    ])

    engine.removeColumns(0, 3, 4)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from right if rightmost columns removed - removing does not have to end with range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '2', '3', '4', ''],
      ['=SUM(B1:E1)'],
    ])

    engine.removeColumns(0, 3, 5)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from right if rightmost columns removed - removing does not have to end with range but may start on end', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '2', '3', '4', ''],
      ['=SUM(B1:E1)'],
    ])

    engine.removeColumns(0, 4, 5)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('D1')))
  })
})

describe('Address dependencies, Case 2: formula in sheet where we make crud with dependency to other sheet', () => {
  it('case A: should not affect absolute dependencies', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '=$Sheet2.$A1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    engine.removeColumns(0, 0, 0)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol(1, 0, 0))
  })

  it('case Ra: removing column before formula should shift dependency', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '=$Sheet2.A1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    engine.removeColumns(0, 0, 0)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
  })

  it('case Rb: removing column after formula should not affect dependency', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A1', '1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    engine.removeColumns(0, 1, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
  })
})

describe('Address dependencies, Case 3: formula in different sheet', () => {
  it('case ARa: relative/absolute dependency after removed column should be shifted ', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.C1', '=$Sheet2.C1', '=$Sheet2.C1', '=$Sheet2.$C1'],
      ],
      Sheet2: [
        ['1', '2', '3'],
      ],
    })

    engine.removeColumns(1, 1, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 1, 0))
    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(1, 0, 0))
    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.relative(1, -1, 0))
    expect(extractReference(engine, adr('D1'))).toEqual(CellAddress.absoluteCol(1, 1, 0))
  })

  it('case ARb: relative/absolute dependency before removed column should not be affected', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A1', '=$Sheet2.$A1'],
      ],
      Sheet2: [
        ['0', '1'],
      ],
    })

    engine.removeColumns(1, 1, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.absoluteCol(1, 0, 0))
  })

  it('case ARc: relative/absolute dependency in removed range should be replaced by #REF', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.$A1', '=$Sheet2.A1'],
      ],
      Sheet2: [
        ['1', '2'],
      ],
    })

    engine.removeColumns(1, 0, 0)

    expect_reference_to_have_ref_error(engine, adr('A1'))
    expect_reference_to_have_ref_error(engine, adr('B1'))
  })

  it('does not truncate any ranges if columns are removed from different sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['', '2', '3'],
        ['=SUM(B1:C1)'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeColumns(1, 1, 1)

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })
})

describe('Address dependencies, Case 4: remove columns in sheet different than formula or dependency sheet', () => {
  it('should not affect dependency when removing columns in not relevant sheet', function() {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['1', '=A1'],
      ],
    })

    engine.removeColumns(0, 0, 0)

    expect(extractReference(engine, adr('B1', 1))).toEqual(CellAddress.relative(1, -1, 0))
  })

  it('should not affect dependency when removing columns in not relevant sheet, more sheets', function() {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['foo'],
      ],
      Sheet3: [
        ['1', '=$Sheet2.A1'],
      ],
    })

    engine.removeColumns(0, 0, 0)

    expect(extractReference(engine, adr('B1', 2))).toEqual(CellAddress.relative(1, -1, 0))
  })
})

describe('Removing columns - reevaluation', () => {
  it('reevaluates', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MEDIAN(B1:D1)', '2', '4', '3'],
    ])
    expect(engine.getCellValue('A1')).toEqual(3)

    engine.removeColumns(0, 2, 2)

    expect(engine.getCellValue('A1')).toEqual(2.5)
  })

  it('dont reevaluate everything', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '', '3'],
      ['=COUNTBLANK(A1:C1)'],
      ['=SUM(A1:A1)'],
    ])
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const a3 = engine.addressMapping.getCell(adr('A3'))
    const a2setCellValueSpy = jest.spyOn(a2 as any, 'setCellValue')
    const a3setCellValueSpy = jest.spyOn(a3 as any, 'setCellValue')

    engine.removeColumns(0, 1, 1)

    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(a3setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '=COLUMNS(A1:C1)'],
    ])
    const d1 = engine.addressMapping.getCell(adr('D1'))
    const d1setCellValueSpy = jest.spyOn(d1 as any, 'setCellValue')

    engine.removeColumns(0, 1, 1)

    expect(d1setCellValueSpy).toHaveBeenCalled()
    expect(extractRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B1')))
  })
})

describe('Removing columns - matrices', () => {
  it('should not remove column within formula matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '{=MMULT(A1:B2, A1:B2)}'],
      ['3', '4'],
    ])

    expect(() => engine.removeColumns(0, 2, 2)).toThrowError('It is not possible to remove column within matrix')
  })

  it('should remove column from numeric matrix', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['1', '2', '3'],
    ], config)

    engine.removeColumns(0, 1, 1)

    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.width).toBe(2)
  })

  it('should remove columns when partial overlap', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    engine.removeColumns(0, 1, 3)
    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.width).toBe(1)
  })

  it('should remove MatrixVertex completely from graph', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeColumns(0, 0, 1)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('should remove MatrixVertex completely from graph, more cols', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['foo', 'bar'],
    ], config)

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeColumns(0, 0, 2)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('does not remove matrix vertices from graph', function() {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['1', '2', '3'],
    ], config)
    expect(engine.graph.nodes.size).toBe(1)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(1)
  })

  it('reevaluates cells dependent on matrix vertex', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1', '1'],
      ['2', '2', '2'],
      ['=SUM(A1:C2)'],
    ], config)

    expect(engine.getCellValue('A3')).toEqual(9)

    engine.removeColumns(0, 1, 1)

    expect(engine.getCellValue('A3')).toEqual(6)
  })

  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
      ['4', '5', '6', '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
      ['', '', '',    '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
    ])

    engine.removeColumns(0, 1, 1)

    expect(extractMatrixRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
      ['4', '5', '6', '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
      ['', '', '',    '{=TRANSPOSE(A1:C2)}', '{=TRANSPOSE(A1:C2)}'],
    ])

    engine.removeColumns(0, 1, 1)

    const matrixVertex = engine.addressMapping.fetchCell(adr('C1')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('C1'))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2', '3'],
        ['4', '5', '6'],
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:C2)}', '{=TRANSPOSE($Sheet1.A1:C2)}'],
        ['{=TRANSPOSE($Sheet1.A1:C2)}', '{=TRANSPOSE($Sheet1.A1:C2)}'],
        ['{=TRANSPOSE($Sheet1.A1:C2)}', '{=TRANSPOSE($Sheet1.A1:C2)}'],
      ],
    })

    engine.removeColumns(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })
})

describe('Removing columns - graph', function() {
  it('should remove edges from other cells to removed nodes', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=B1'],
    ])

    engine.removeColumns(0, 2, 2)

    const b1 = engine.addressMapping.fetchCell(adr('b1'))
    expect(engine.graph.adjacentNodes(b1)).toEqual(new Set())
  })

  it('should remove vertices from graph', function() {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '4'],
      ['1', '2', '3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(8)
    engine.removeColumns(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(4) // left two vertices in first column, two in last
  })

  it('works if there are empty cells removed', function() {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '', '3'],
    ])
    expect(engine.graph.nodes.size).toBe(2)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(2)
  })
})

describe('Removing columns - dependencies', () => {
  it('should not affect absolute dependencies to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2', '=$Sheet2.$A1'],
        /*      */
      ],
      Sheet2: [
        ['3'],
        ['4'],
      ],
    })

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol(1, 0, 0))
    engine.removeColumns(0, 0, 1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol(1, 0, 0))
  })

})

describe('Removing columns - ranges', function() {
  it('shift ranges in range mapping, range start at right of removed columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['', '=SUM(B1:C1)', ''],
      /**/
    ])

    engine.removeColumns(0, 0, 0)

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('B1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start before removed columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['=SUM(A1:C1)', '', ''],
                     /*   */
    ])

    engine.removeColumns(0, 1, 2)

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '=SUM(A1:C1)'],
      /*          */
    ])
    const range = engine.rangeMapping.getRange(adr('A1'), adr('C1')) as RangeVertex

    engine.removeColumns(0, 0, 2)

    const ranges = Array.from(engine.rangeMapping.rangesInSheet(0))
    expect(ranges.length).toBe(0)
    expect(engine.graph.hasNode(range)).toBe(false)
  })
})

it('does not truncate any ranges if columns are removed from different sheet', () => {
  const engine = HandsOnEngine.buildFromSheets({
    Sheet1: [
      ['1', '2', '=SUM(A1:B1)'],
    ],
    Sheet2: [
      ['1'],
    ],
  })

  engine.removeColumns(1, 0, 0)

  expect(extractRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B1')))
})
