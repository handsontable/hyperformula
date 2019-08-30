import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {CellReferenceAst} from '../src/parser/Ast'
import {CellAddress} from '../src/parser/CellAddress'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import './testConfig.ts'
import {extractReference, adr, extractMatrixRange, expectEngineToBeTheSameAs} from "./testUtils";

describe('Adding row - matrix check', () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(() => {
      engine.addRows(0, 3, 1)
    }).toThrow(new Error('It is not possible to add row in row with matrix'))

    expect(() => {
      engine.addRows(0, 2, 1)
    }).toThrow(new Error('It is not possible to add row in row with matrix'))
  })
})

describe('Adding row - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)'],
      // new row
      ['2'],
    ])

    expect(engine.getCellValue('B1')).toEqual(0)
    engine.addRows(0, 1, 1)
    expect(engine.getCellValue('B1')).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)', '=SUM(A1:A1)'],
      // new row
      ['2'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const b1setCellValueSpy = jest.spyOn(b1 as any, 'setCellValue')
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, 1, 1)

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HandsOnEngine.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, 0, 1)

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })
})

describe('Adding row - MatrixVertex', () => {
  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A4'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4']
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
      ]
    })

    engine.addRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, 1, 1)

    const matrixVertex = engine.addressMapping.fetchCell(adr('A4')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('A4'))
  })
})

describe('Adding row - FormulaCellVertex#address update', () => {
  it('insert row, formula vertex address shifted', () => {
    const engine = HandsOnEngine.buildFromArray([
      // new row
      ['=SUM(1,2)'],
    ])

    let vertex = engine.addressMapping.fetchCell(adr('A1')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1'))
    engine.addRows(0, 0, 1)
    vertex = engine.addressMapping.fetchCell(adr('A2')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A2'))
  })

  it("adding row in different sheet but same row as formula should not update formula address", () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        // new row
        ['1']
      ],
      Sheet2: [
        ['=$Sheet1.A1']
      ]
    })

    engine.addRows(0, 0, 1)

    const formulaVertex = engine.addressMapping.fetchCell(adr("A1", 1)) as FormulaCellVertex

    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
  })
})

describe('Adding row - matrices adjustments', () => {
  it('add row inside numeric matrix, expand matrix', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('A2')).toEqual(3)

    engine.addRows(0, 1, 2)

    expect(engine.getCellValue('A2')).toEqual(0)
    expect(engine.getCellValue('A3')).toEqual(0)
    expect(engine.getCellValue('A4')).toEqual(3)
  })
})

describe('Adding row - address mapping', () => {
  it('verify sheet dimensions', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      // new col
      ['2']
    ])

    engine.addRows(0, 1, 1)

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 3,
    })
  })
})
