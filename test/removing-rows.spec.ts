import {Config, HandsOnEngine} from "../src";
import {ErrorType, CellError, SimpleCellAddress, simpleCellAddress} from "../src/Cell";
import {CellAddress} from "../src/parser/CellAddress";
import './testConfig.ts'
import {FormulaCellVertex, MatrixVertex} from "../src/DependencyGraph";
import {buildCellErrorAst, CellReferenceAst} from "../src/parser";

const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

const expect_reference_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula()
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

describe('Removing rows - dependencies', () => {
  it('should not affect absolute dependencies to other sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
          ['1'], // rows to delete
          ['2'], //
          ['=$Sheet2.A$1']
      ],
      Sheet2: [
          ['3'],
          ['4']
      ]
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
        ['2']
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
      ['3']
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
})

describe('Removing rows - matrices', () => {
  it('should not remove row with formula matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1','2'],
        ['3','4'],
        ['{=MMULT(A1:B2, A1:B2)}']
    ])

    expect(() => engine.removeRows(0, 2, 2)).toThrowError("It is not possible to remove row with matrix")
  })

  it('should remove row from numeric matrix', () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1','2'],
      ['3','4'],
    ], config)

    engine.removeRows(0, 1, 1)

    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })

  it('should remove rows when partial overlap', () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1','2'],
      ['3','4'],
    ], config)

    engine.removeRows(0, 1, 3)
    const matrix = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as MatrixVertex
    expect(matrix).toBeInstanceOf(MatrixVertex)
    expect(matrix.height).toBe(1)
  })
})

describe('Removing rows - graph', function () {
  it('should remove vertices from graph', function () {
    const engine = HandsOnEngine.buildFromArray([
        ['1', '2'],
        ['3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(5)
    engine.removeRows(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(1) //only empty vertex left
  });
});
