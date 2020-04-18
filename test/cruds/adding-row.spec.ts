import sinon from 'sinon'
import {EmptyValue, ExportedCellChange, HyperFormula, SheetSizeLimitExceededError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {simpleCellAddress} from '../../src/Cell'
import {ColumnIndex} from '../../src/ColumnSearch/ColumnIndex'
import {FormulaCellVertex, MatrixVertex} from '../../src/DependencyGraph'
import {adr, expectArrayWithSameContent, extractMatrixRange} from '../testUtils'
import {Config} from '../../src/Config'

describe('Adding row - checking if its possible', () => {
  it('no if starting row is negative', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [-1, 1])).toEqual(false)
  })

  it('no if starting row is not an integer', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [1.5, 1])).toEqual(false)
  })

  it('no if starting row is NaN', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [NaN, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [Infinity, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [-Infinity, 1])).toEqual(false)
  })

  it('no if number of rows is not positive', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 0])).toEqual(false)
  })

  it('no if number of rows is not an integer', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1.5])).toEqual(false)
  })

  it('no if number of rows is NaN', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-Infinity, [0, 1])).toEqual(false)
  })

  it('no if theres a formula matrix in place where we add', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(engine.isItPossibleToAddRows(0, [1, 1])).toEqual(true)
    expect(engine.isItPossibleToAddRows(0, [2, 1])).toEqual(true)
    expect(engine.isItPossibleToAddRows(0, [3, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [4, 1])).toEqual(true)
  })

  it('no if adding row would exceed sheet size limit', () => {
    const engine = HyperFormula.buildFromArray(
      Array(Config.defaultConfig.maxRows - 1).fill([''])
    )

    expect(engine.isItPossibleToAddRows(0, [0, 2])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, 1], [5, 1])).toEqual(false)
  })

  it('yes if theres a numeric matrix in place where we add', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    expect(engine.isItPossibleToAddRows(0, [0, 1])).toEqual(true)
    expect(engine.isItPossibleToAddRows(0, [1, 1])).toEqual(true)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1])).toEqual(true)
  })
})

describe('Adding row - matrix check', () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(() => {
      engine.addRows(0, [3, 1])
    }).toThrowError('It is not possible to add row in row with matrix')
  })

  it('should be possible to add row right above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE(A3:B4)}', '{=TRANSPOSE(A3:B4)}'],
      ['{=TRANSPOSE(A3:B4)}', '{=TRANSPOSE(A3:B4)}'],
      ['1', '2'],
      ['3', '4'],
    ])

    engine.addRows(0, [0, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('should be possible to add row right after matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE(A3:B4)}', '{=TRANSPOSE(A3:B4)}'],
      ['{=TRANSPOSE(A3:B4)}', '{=TRANSPOSE(A3:B4)}'],
      ['1', '2'],
      ['3', '4'],
    ])

    engine.addRows(0, [2, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })
})

describe('Adding row - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)'],
      // new row
      ['2'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    engine.addRows(0, [1, 1])
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)', '=SUM(A1:A1)'],
      // new row
      ['2'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1setCellValueSpy = sinon.spy(b1 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = sinon.spy(c1 as any, 'setCellValue')

    engine.addRows(0, [1, 1])

    expect(b1setCellValueSpy.called).toBe(true)
    expect(c1setCellValueSpy.notCalled).toBe(true)
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HyperFormula.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = sinon.spy(c1 as any, 'setCellValue')

    engine.addRows(0, [0, 1])

    expect(c1setCellValueSpy.called).toBe(true)
  })

  it('returns changed values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))

    const changes = engine.addRows(0, [1, 1])

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 1, 2), 1))
  })
})

describe('Adding row - MatrixVertex', () => {
  it('MatrixVertex#formula should be updated', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A4'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4'],
      ],
      Sheet2: [
        ['{=TRANSPOSE(Sheet1!A1:B2)}', '{=TRANSPOSE(Sheet1!A1:B2)}'],
        ['{=TRANSPOSE(Sheet1!A1:B2)}', '{=TRANSPOSE(Sheet1!A1:B2)}'],
      ],
    })

    engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('A4')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('A4'))
  })
})

describe('Adding row - FormulaCellVertex#address update', () => {
  it('insert row, formula vertex address shifted', () => {
    const engine = HyperFormula.buildFromArray([
      // new row
      ['=SUM(1,2)'],
    ])

    let vertex = engine.addressMapping.fetchCell(adr('A1')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1'))
    engine.addRows(0, [0, 1])
    vertex = engine.addressMapping.fetchCell(adr('A2')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A2'))
  })

  it('adding row in different sheet but same row as formula should not update formula address', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        // new row
        ['1'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
      ],
    })

    engine.addRows(0, [0, 1])

    const formulaVertex = engine.addressMapping.fetchCell(adr('A1', 1)) as FormulaCellVertex

    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
  })
})

describe('Adding row - matrices adjustments', () => {
  it('add row inside numeric matrix, expand matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(engine.getCellValue(adr('A2'))).toEqual(3)

    engine.addRows(0, [1, 2])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })
})

describe('Adding row - address mapping', () => {
  it('verify sheet dimensions', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      // new row
      ['2'],
    ])

    engine.addRows(0, [1, 1])

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 3,
    })
  })
})

describe('Adding row - sheet dimensions', () => {
  it('should do nothing when adding row outside effective sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      // new row
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = sinon.spy(engine.evaluator as any, 'partialRun')
    engine.addRows(0, [1, 1])
    engine.addRows(0, [10, 15])

    expect(recalcSpy.notCalled).toBe(true)
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to expand sheet beyond limits', () => {
    const engine = HyperFormula.buildFromArray(Array(Config.defaultConfig.maxRows - 1).fill(['']))

    expect(() => {
      engine.addRows(0, [0, 2])
    }).toThrow(new SheetSizeLimitExceededError())

    expect(() => {
      engine.addRows(0, [0, 1], [5, 1])
    }).toThrow(new SheetSizeLimitExceededError())
  })
})

describe('Adding row - column index', () => {
  it('should update column index when adding row', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=VLOOKUP(2, A1:A10, 1, TRUE())'],
      ['2'],
    ], {useColumnIndex: true})

    engine.addRows(0, [1, 1])

    const index = (engine.columnSearch as ColumnIndex)
    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([2], index.getValueIndex(0, 0, 2).index)
  })
})
