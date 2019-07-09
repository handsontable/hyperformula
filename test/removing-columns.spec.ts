import {Config, HandsOnEngine} from "../src";
import {ErrorType, CellError, SimpleCellAddress, simpleCellAddress} from "../src/Cell";
import {CellAddress} from "../src/parser/CellAddress";
import {buildCellErrorAst, CellReferenceAst} from "../src/parser";
import './testConfig.ts'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex} from "../src/DependencyGraph";

const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

const expect_reference_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula()
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

describe('Removing columns', () => {
  it('reevaluates', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=MEDIAN(B1:D1)', '2', '4', '3'],
    ])
    expect(engine.getCellValue('A1')).toEqual(3)

    engine.removeColumns(0, 2, 2)

    expect(engine.getCellValue('A1')).toEqual(2.5)
  })
})

describe('Removing columns - matrices', () => {
  it('should not remove column within formula matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '{=MMULT(A1:B2, A1:B2)}'],
      ['3', '4'],
    ])

    expect(() => engine.removeColumns(0, 2, 2)).toThrowError("It is not possible to remove column within matrix")
  })

  it('should remove column from numeric matrix', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['1', '2', '3'],
    ], config)

    engine.removeColumns(0, 1, 1)

    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
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
    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.width).toBe(1)
  })

  it('should remove MatrixVertex completely from graph', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    engine.removeColumns(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(1)
  })
});

describe('Removing columns - graph', function () {
  it('should remove vertices from graph', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '4'],
      ['1', '2', '3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(9)
    engine.removeColumns(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(5) // left two vertices in first column, two in last and empty singleton
  });

  it('works if there are empty cells removed', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '', '3'],
    ])
    expect(engine.graph.nodes.size).toBe(3)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(3)
  });

  it('does not remove matrix vertices from graph', function () {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['1', '2', '3'],
    ], config)
    expect(engine.graph.nodes.size).toBe(2)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(2)
  });
});

describe('Removing columns - dependencies', () => {
  it('should not affect absolute dependencies to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2', '=$Sheet2.$A1'],
        /*      */
      ],
      Sheet2: [
        ['3'],
        ['4']
      ]
    })

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absoluteCol(1, 0, 0))
    engine.removeColumns(0, 0, 1)
    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteCol(1, 0, 0))
  })

  it('same sheet, case Aa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', '1', '', '=$B1'],
               /**/
    ])

    engine.removeColumns(0, 2)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$C1', '', '42'],
              /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteCol(0, 1, 0))
  })

  it('same sheet, case Ac', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$B1', ''],
              /**/
    ])

    engine.removeColumns(0, 1)

    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '=A1', '2'],
                    /**/
    ])

    engine.removeColumns(0, 2, 2)

    expect(extractReference(engine, simpleCellAddress(0, 1, 0))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '1', '=A1']
            /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, simpleCellAddress(0, 1, 0))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=C1', '1', '42']
              /**/
    ])

    engine.removeColumns(0, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=C1', '42'],
      /**/
    ])

    engine.removeColumns(0, 0)
    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rca', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '1']
             /**/
    ])

    engine.removeColumns(0, 1)
    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })

  it('same sheet, case Rcb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
    ])

    engine.removeColumns(0, 0)
    expect_reference_to_have_ref_error(engine, simpleCellAddress(0, 0, 0))
  })
})

describe('Removing columns - ranges', function () {
  it('shift ranges in range mapping, range start at right of removed columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['', '=SUM(B1:C1)', ''],
      /**/
    ])

    engine.removeColumns(0, 0, 0)

    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 1, 0))!
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start before removed columns', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['=SUM(A1:C1)', '', ''],
                     /*   */
    ])

    engine.removeColumns(0, 1, 2)

    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 0))!
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '=SUM(A1:C1)'],
      /*          */
    ])
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0)) as RangeVertex

    engine.removeColumns(0, 0, 2)

    const ranges = Array.from(engine.rangeMapping.getValues())
    expect(ranges.length).toBe(0)
    expect(engine.graph.hasNode(range)).toBe(false)
  })
});
