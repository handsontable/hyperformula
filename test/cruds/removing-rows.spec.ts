import {HyperFormula, ExportedCellChange} from '../../src'
import {simpleCellAddress} from '../../src/Cell'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ColumnIndex} from '../../src/ColumnSearch/ColumnIndex'
import {MatrixVertex} from '../../src/DependencyGraph'
import {InvalidArgumentsError} from '../../src'
import {CellAddress} from '../../src/parser'
import {
  adr, expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  expectFunctionToHaveRefError,
  expectReferenceToHaveRefError,
  extractMatrixRange,
  extractRange,
  extractReference,
} from '../testUtils'

describe('Removing rows - checking if its possible', () => {
  it('no if starting row is negative', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(0, [-1, 1])).toEqual(false)
  })

  it('no if starting row is not an integer', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(0, [1.5, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [NaN, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [Infinity, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [-Infinity, 2])).toEqual(false)
  })

  it('no if number of rows is negative', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(0, [0, -1])).toEqual(false)
  })

  it('no if number of rows is not an integer', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(0, [0, 1.5])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(-Infinity, [0, 1])).toEqual(false)
  })

  it('no if theres a formula matrix in place where we remove', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(engine.isItPossibleToRemoveRows(0, [1, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveRows(0, [1, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [2, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [3, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveRows(0, [4, 1])).toEqual(true)
  })

  it('yes if theres a numeric matrix in place where we add', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    expect(engine.isItPossibleToRemoveRows(0, [0, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveRows(0, [1, 1])).toEqual(true)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveRows(0, [0, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveRows(0, [1, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveRows(0, [1, 2])).toEqual(true)
  })
})

describe('Address dependencies, Case 1: same sheet', () => {
  it('case Aa: absolute dependency above removed row should not be affected', () => {
    const engine = HyperFormula.buildFromArray([
      [null],
      ['1'],
      [null], // row to delete
      ['=A$2'],
    ])

    engine.removeRows(0, [2, 1])

    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteRow(null, 0, 1))
  })

  it('case Ab: absolute dependency below removed row should be shifted', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A$3'],
      [null], // row to delete
      ['42'],
    ])

    engine.removeRows(0, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(null, 0, 1))
  })

  it('case Ac: absolute dependency in removed row range should be replaced by #REF', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A$2'],
      [null], // row to delete
    ])

    engine.removeRows(0, [1, 1])

    expectReferenceToHaveRefError(engine, adr('A1'))
  })

  it('case Raa: relative dependency and formula above removed rows should not be affected', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
      ['=A1'],
      ['2'],
    ])

    engine.removeRows(0, [2, 1])

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(null, 0, -1))
  })

  it('case Rab: relative address should be shifted when only formula is moving', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
      ['1'],
      ['2'],
      ['=A1'],
    ])

    engine.removeRows(0, [1, 2])

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(null, 0, -1))
  })

  it('case Rba: relative address should be shifted when only dependency is moving', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A4'],
      ['1'],
      ['2'],
      ['42'],
    ])

    engine.removeRows(0, [1, 2])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(null, 0, 1))
  })

  it('case Rbb: relative address should not be affected when dependency and formula is moving', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=A4'],
      ['42'],
    ])

    engine.removeRows(0, [0, 2])
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(null, 0, 1))
  })

  it('case Rca: relative dependency in deleted row range should be replaced by #REF', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A3'],
      ['1'],
      ['2'],
      ['3'],
    ])

    engine.removeRows(0, [1, 2])
    expectReferenceToHaveRefError(engine, adr('A1'))
  })

  it('case Rcb: relative dependency in deleted row range should be replaced by #REF', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=A2'],
    ])

    engine.removeRows(0, [0, 2])
    expectReferenceToHaveRefError(engine, adr('A2'))
  })

  it('case Rca, range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(A2:A3)'],
      ['1'], //
      ['2'], //
    ])
    engine.removeRows(0, [1, 2])
    expectFunctionToHaveRefError(engine, adr('A1'))
  })
})

describe('Address dependencies, Case 2: formula in sheet where we make crud with dependency to other sheet', () => {
  it('case A: should not affect absolute dependencies', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'], // row to delete
        ['=Sheet2!A$1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.absoluteRow(1, 0, 0))
    engine.removeRows(0, [0, 1])
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(1, 0, 0))
  })

  it('case Ra: removing row above formula should shift dependency', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'], // row to delete
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(1, 0, -1))
    engine.removeRows(0, [0, 1])
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
  })

  it('case Rb: removing row below formula should not affect dependency', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
        ['1'], // row to delete
      ],
      Sheet2: [
        ['2'],
      ],
    })

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
    engine.removeRows(0, [1, 1])
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
  })
})

describe('Address dependencies, Case 3: formula in different sheet', () => {
  it('case ARa: relative/absolute dependency below removed row should be shifted ', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A3'],
        ['=Sheet2!A3'],
        ['=Sheet2!A3'],
        ['=Sheet2!A$3'],
      ],
      Sheet2: [
        ['1'],
        ['2'], // row to delete
        ['3'],
      ],
    })

    engine.removeRows(1, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 1))
    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(1, 0, 0))
    expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.relative(1, 0, -1))
    expect(extractReference(engine, adr('A4'))).toEqual(CellAddress.absoluteRow(1, 0, 1))
  })

  it('case ARb: relative/absolute dependency above removed row should not be affected', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
        ['=Sheet2!A$1'],
      ],
      Sheet2: [
        ['0'],
        ['1'],  // row to delete
      ],
    })

    engine.removeRows(1, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 0))
    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.absoluteRow(1, 0, 0))
  })

  it('case ARc: relative/absolute dependency in removed range should be replaced by #REF', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A$1'],
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'], // row to delete
        ['2'],
      ],
    })

    engine.removeRows(1, [0, 1])

    expectReferenceToHaveRefError(engine, adr('A1'))
    expectReferenceToHaveRefError(engine, adr('A2'))
  })

  it('does not truncate any ranges if rows are removed from different sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        [null, '=SUM(A2:A3)'],
        ['2'],
        ['3'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeRows(1, [1, 1])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })
})

describe('Address dependencies, Case 4: remove rows in sheet different than formula or dependency sheet', () => {
  it('should not affect dependency when removing rows in not relevant sheet', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'], // to remove
      ],
      Sheet2: [
        ['1'],
        ['=A1'],
      ],
    })

    engine.removeRows(0, [0, 1])

    expect(extractReference(engine, adr('A2', 1))).toEqual(CellAddress.relative(null, 0, -1))
  })

  it('should not affect dependency when removing rows in not relevant sheet, more sheets', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'], // to remove
      ],
      Sheet2: [
        ['foo'],
      ],
      Sheet3: [
        ['1'],
        ['=Sheet2!A1'],
      ],
    })

    engine.removeRows(0, [0, 1])

    expect(extractReference(engine, adr('A2', 2))).toEqual(CellAddress.relative(1, 0, -1))
  })
})

describe('Removing rows - range dependencies, same sheet', () => {
  it('truncates range by one row from top if topmost row removed', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A3)'],
      ['1'],
      ['2'],
    ])

    engine.removeRows(0, [1, 1])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A2')))
  })

  it('truncates range by one row from bottom if last row removed', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A3)'],
      ['1'],
      ['2'],
    ])

    engine.removeRows(0, [2, 1])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A2')))
  })

  it('truncates range by rows from top if topmost rows removed', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.removeRows(0, [1, 2])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from top if topmost rows removed - removing does not have to start with range', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A3:A6)'],
      [null],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
    ])

    engine.removeRows(0, [1, 3])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from top if topmost rows removed - removing does not have to start with range but may end on start', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A3:A6)'],
      [null],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
    ])

    engine.removeRows(0, [1, 2])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A4')))
  })

  it('truncates range by rows from bottom if bottomest rows removed', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.removeRows(0, [3, 2])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from bottom if bottomest rows removed - removing does not have to end with range', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      [null],
    ])

    engine.removeRows(0, [3, 3])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A3')))
  })

  it('truncates range by rows from bottom if bottomest rows removed - removing does not have to end with range but may start on end', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=SUM(A2:A5)'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      [null],
    ])

    engine.removeRows(0, [4, 2])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A2'), adr('A4')))
  })
})

describe('Removing rows - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A3)'],
      [null], // deleted
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    engine.removeRows(0, [1, 1])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('dont reevaluate everything', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A3)', '=SUM(A1:A1)'],
      [null], // deleted
      ['3'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1setCellValueSpy = spyOn(b1 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    engine.removeRows(0, [1, 1])

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=COLUMNS(A1:B1)'],
      ['1'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    engine.removeRows(0, [1, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('should reevaluate formula when range reduced to zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(A1:A2)'],
    ])

    const a3 = engine.addressMapping.getCell(adr('A3'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a3setCellValueSpy = spyOn(a3 as any, 'setCellValue')

    engine.removeRows(0, [0, 2])

    expect(a3setCellValueSpy).toHaveBeenCalled()
    expectFunctionToHaveRefError(engine, adr('A1'))
  })
})

describe('Removing rows - matrices', () => {
  it('should not remove row with formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=MMULT(A1:B2, A1:B2)}'],
    ])

    expect(() => engine.removeRows(0, [2, 1])).toThrowError('Cannot perform this operation, source location has a matrix inside.')
  })

  it('should remove row from numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.removeRows(0, [1, 1])

    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })

  it('should remove rows when partial overlap', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.removeRows(0, [1, 3])
    const matrix = engine.addressMapping.fetchCell(adr('A1')) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })

  it('should remove MatrixVertex completely from graph', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeRows(0, [0, 2])
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('should remove MatrixVertex completely from graph, more rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['foo', 'bar'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    engine.removeRows(0, [0, 3])
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('does not remove matrix vertices from graph', function() {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
      ['1', '2'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})
    expect(engine.graph.nodes.size).toBe(1)
    engine.removeRows(0, [1, 2])
    expect(engine.graph.nodes.size).toBe(1)
  })

  it('reevaluates cells dependent on matrix vertex', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:B3)'],
      ['1', '2'],
      ['1', '2'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.removeRows(0, [1, 1])

    expect(engine.getCellValue(adr('C1'))).toEqual(6)
  })

  it('MatrixVertex#formula should be updated', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
    ])

    engine.removeRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A3'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
      ['{=TRANSPOSE(A1:B3)}', '{=TRANSPOSE(A1:B3)}, {=TRANSPOSE(A1:B3)}'],
    ])

    engine.removeRows(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('A3')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('A3'))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '4'],
        ['2', '5'],
        ['3', '6'],
      ],
      Sheet2: [
        ['{=TRANSPOSE(Sheet1!A1:B3)}', '{=TRANSPOSE(Sheet1!A1:B3)}'],
        ['{=TRANSPOSE(Sheet1!A1:B3)}', '{=TRANSPOSE(Sheet1!A1:B3)}'],
      ],
    })

    engine.removeRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })
})

describe('Removing rows - graph', function() {
  it('should remove edges from other cells to removed nodes', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=A2'], //
    ])

    engine.removeRows(0, [2, 1])

    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    expect(engine.graph.adjacentNodes(a2)).toEqual(new Set())
  })

  it('should remove vertices from graph', function() {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(4)
    engine.removeRows(0, [0, 2])
    expect(engine.graph.nodes.size).toBe(0)
  })

  it('works if there are empty cells removed', function() {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      [null],
      ['3'],
    ])
    expect(engine.graph.nodes.size).toBe(2)
    engine.removeRows(0, [1, 1])
    expect(engine.graph.nodes.size).toBe(2)
  })
})

describe('Removing rows - range mapping', function() {
  it('shift ranges in range mapping, range start below removed rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', null],
      ['2', '=SUM(A2:A3)'],
      ['3', null],
    ])

    engine.removeRows(0, [0, 1])
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A2'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start above removed rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', null],
      ['3', null],
    ])

    engine.removeRows(0, [1, 2])
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
    ])

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    engine.removeRows(0, [0, 3])
    const ranges = Array.from(engine.rangeMapping.rangesInSheet(0))
    expect(ranges.length).toBe(0)
    expect(engine.graph.hasNode(range)).toBe(false)
  })

  it('should remove smaller range dependency', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])

    const a1a3 = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    expect(engine.graph.getDependencies(a1a3).length).toBe(2)
    engine.removeRows(0, [0, 2])
    const a1a1 = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    expect(a1a1).toBe(a1a3)
    expect(engine.graph.getDependencies(a1a1).length).toBe(1)
  })
})

describe('Removing rows - sheet dimensions', () => {
  it('should do nothing when removed row outside effective sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = spyOn(engine.evaluator as any, 'partialRun')
    engine.removeRows(0, [1, 1])
    engine.removeRows(0, [10, 6])

    expect(recalcSpy).not.toHaveBeenCalled()
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to remove non positive number of rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
    ])

    expect(() => engine.removeRows(0, [1, 0])).toThrow(new InvalidArgumentsError())
  })

  it('returns changed values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(A1:A2)'],
    ])

    const changes = engine.removeRows(0, [0, 1])

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 0, 1), 2))
  })
})

describe('Removing rows - column index', () => {
  it('should update column index when adding row', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=VLOOKUP(2, A1:A10, 1, TRUE())'],
      [null],
      ['2'],
    ], { useColumnIndex: true })

    engine.removeRows(0, [1, 1])

    const index = (engine.columnSearch as ColumnIndex)

    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([1], index.getValueIndex(0, 0, 2).index)
  })
})

describe('Removing rows - row range', () => {
  it('removing rows - start of row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
      ['1', '2', '=SUM(1:3)']
    ])

    engine.removeRows(0, [0, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2', '=SUM(1:2)']
    ]))
  })

  it('removing rows - middle of row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
      ['1', '2', '=SUM(1:3)']
    ])

    engine.removeRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2', '=SUM(1:2)']
    ]))
  })

  it('removing rows - end of row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(1:3)'],
      ['1', '2'],
      ['1', '2']
    ])

    engine.removeRows(0, [2, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2', '=SUM(1:2)'],
      ['1', '2']
    ]))
  })
})

describe('Removing rows - column range', () => {
  it('should not affect column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
      ['1', '2', '=SUM(A:B)'],
    ])

    engine.removeRows(0, [0, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2', '=SUM(A:B)'],
    ]))
  })
})
