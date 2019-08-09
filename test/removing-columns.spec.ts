import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {MatrixVertex, RangeVertex} from '../src/DependencyGraph'
import {CellAddress} from '../src/parser/CellAddress'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import './testConfig.ts'
import {extractRange, adr, expect_function_to_have_ref_error, expect_reference_to_have_ref_error, extractReference} from './testUtils'

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
    const a2 = engine.addressMapping!.getCell(adr('A2'))
    const a3 = engine.addressMapping!.getCell(adr('A3'))
    const a2setCellValueSpy = jest.spyOn(a2 as any, 'setCellValue')
    const a3setCellValueSpy = jest.spyOn(a3 as any, 'setCellValue')

    engine.removeColumns(0, 1, 1)

    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(a3setCellValueSpy).not.toHaveBeenCalled()
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

    const matrix = engine.addressMapping!.fetchCell(adr('A1')) as MatrixVertex
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
    const matrix = engine.addressMapping!.fetchCell(adr('A1')) as MatrixVertex
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
      ['=SUM(A1:C2)']
    ], config)

    expect(engine.getCellValue('A3')).toEqual(9)

    engine.removeColumns(0, 1, 1)

    expect(engine.getCellValue('A3')).toEqual(6)
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

  it('same sheet, case Aa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '', '=$B1'],
               /**/
    ])

    engine.removeColumns(0, 2)

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$C1', '', '42'],
              /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('same sheet, case Ac', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$B1', ''],
              /**/
    ])

    engine.removeColumns(0, 1)

    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '=A1', '2'],
                    /**/
    ])

    engine.removeColumns(0, 2, 2)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '1', '=A1'],
            /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=C1', '1', '42'],
              /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=C1', '42'],
      /**/
    ])

    engine.removeColumns(0, 0)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rca', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '1'],
             /**/
    ])

    engine.removeColumns(0, 1)
    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('same sheet, case Rcb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
    ])

    engine.removeColumns(0, 0)
    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('same sheet, case Rca, range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=SUM(B1:C1)', '1', '2'],
    ])
    engine.removeColumns(0, 1, 2)
    expect_function_to_have_ref_error(engine, adr('A1'))
  })

  xit('truncates range by one column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=SUM(A1:B1)']
    ])

    engine.removeColumns(0, 0, 0)

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(CellAddress.relative(0, -1, 0), CellAddress.relative(0, -1, 0)))
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

    const range = engine.rangeMapping.getRange(adr('A1'), adr('B1'))!
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start before removed columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['=SUM(A1:C1)', '', ''],
                     /*   */
    ])

    engine.removeColumns(0, 1, 2)

    const range = engine.rangeMapping.getRange(adr('A1'), adr('A1'))!
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
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
