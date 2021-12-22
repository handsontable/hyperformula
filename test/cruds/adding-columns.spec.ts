import {ExportedCellChange, HyperFormula} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {Config} from '../../src/Config'
import {ArrayVertex, FormulaCellVertex} from '../../src/DependencyGraph'
import {AlwaysDense} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {SheetSizeLimitExceededError} from '../../src/errors'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {
  adr,
  expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  extractMatrixRange,
  extractRange
} from '../testUtils'

describe('Adding column - checking if its possible', () => {
  it('no if starting column is negative', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [-1, 1])).toEqual(false)
  })

  it('no if starting column is not an integer', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [1.5, 1])).toEqual(false)
  })

  it('no if starting column is NaN/Infinity', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [NaN, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(0, [Infinity, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(0, [-Infinity, 1])).toEqual(false)
  })

  it('no if number of columns is not positive', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [0, 0])).toEqual(false)
  })

  it('no if number of columns is not an integer', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [0, 1.5])).toEqual(false)
  })

  it('no if number of columns is NaN/Infinity', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(-Infinity, [0, 1])).toEqual(false)
  })

  it('no if adding column would exceed sheet size limit', () => {
    const [engine] = HyperFormula.buildFromArray([
      Array(Config.defaultConfig.maxColumns - 1).fill('')
    ])

    expect(engine.isItPossibleToAddColumns(0, [0, 2])).toEqual(false)
    expect(engine.isItPossibleToAddColumns(0, [0, 1], [5, 1])).toEqual(false)
  })

  it('yes otherwise', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddColumns(0, [0, 1])).toEqual(true)
  })
})

describe('Adding column - matrix check', () => {
  it('should be possible to add a row crossing matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', 'foo', 'bar'],
      ['3', '4', '=TRANSPOSE(A1:B3)'],
      ['5', '6'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    engine.addColumns(0, [3, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2', 'foo', null, 'bar'],
      ['3', '4', '=TRANSPOSE(A1:B3)'],
      ['5', '6']
    ])[0])
  })

  it('should adjust matrix address mapping when adding multiple columns', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', 'foo', 'bar'],
      ['3', '4', '=TRANSPOSE(A1:B3)'],
      ['5', '6'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    engine.addColumns(0, [3, 3])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2', 'foo', null, null, null, 'bar'],
      ['3', '4', '=TRANSPOSE(A1:B3)'],
      ['5', '6']
    ])[0])
  })

  it('should be possible to add row right before matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(C1:D2)', undefined, '1', '2'],
      [undefined, undefined, '3', '4'],
    ])

    engine.addColumns(0, [0, 1])

    expect(engine.getCellValue(adr('A1'))).toBe(null)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(3)
    expect(engine.getCellValue(adr('D1'))).toEqual(1)
  })

  it('should be possible to add row right after matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(C1:D2)', undefined, '1', '2'],
      [undefined, undefined, '3', '4'],
    ])

    engine.addColumns(0, [2, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toBe(null)
    expect(engine.getCellValue(adr('D1'))).toEqual(1)
  })
})

describe('Adding column - reevaluation', () => {
  it('reevaluates cells', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', /* new col */ '2', '=COUNTBLANK(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(0)
    engine.addColumns(0, [1, 1])
    expect(engine.getCellValue(adr('D1'))).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', /* new col */ '2', '=COUNTBLANK(A1:B1)'],
      ['=SUM(A1:A1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const a2 = engine.addressMapping.getCell(adr('A2'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a2setCellValueSpy = spyOn(a2 as any, 'setCellValue')

    engine.addColumns(0, [1, 1])

    expect(a2setCellValueSpy).not.toHaveBeenCalled()
    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', /* */ '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    engine.addColumns(0, [1, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
    expect(extractRange(engine, adr('D1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C1')))
  })

  it('returns changed values', () => {
    const [engine] = HyperFormula.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])

    const [changes] = engine.addColumns(0, [1, 1])

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('D1'), 3))
  })
})

describe('Adding column - FormulaCellVertex#address update', () => {
  it('updates addresses in formulas', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', /* new col */ '=A1'],
    ])

    engine.addColumns(0, [1, 1])

    const c1 = engine.addressMapping.getCell(adr('C1')) as FormulaCellVertex
    expect(c1).toBeInstanceOf(FormulaCellVertex)
    expect(c1.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('C1'))
  })
})

describe('Adding column - address mapping', () => {
  it('verify sheet dimensions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', /* new col */ '=A1'],
    ])

    engine.addColumns(0, [1, 1])

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 3,
      height: 1,
    })
  })
})

describe('different sheet', () => {
  it('adding row in different sheet but same row as formula should not update formula address', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
      ],
    })

    engine.addColumns(0, [0, 1])

    const formulaVertex = engine.addressMapping.fetchCell(adr('A1', 1)) as FormulaCellVertex

    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
  })
})

describe('Adding column - sheet dimensions', () => {
  it('should do nothing when adding column outside effective sheet', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = spyOn(engine.evaluator as any, 'partialRun')
    engine.addColumns(0, [1, 1])
    engine.addColumns(0, [10, 15])

    expect(recalcSpy).not.toHaveBeenCalled()
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to expand sheet beyond limits', () => {
    const [engine] = HyperFormula.buildFromArray([
      Array(Config.defaultConfig.maxColumns - 1).fill('')
    ])

    expect(() => {
      engine.addColumns(0, [0, 2])
    }).toThrow(new SheetSizeLimitExceededError())

    expect(() => {
      engine.addColumns(0, [0, 1], [5, 1])
    }).toThrow(new SheetSizeLimitExceededError())
  })
})

describe('Adding column - column index', () => {
  it('should update column index when adding row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=VLOOKUP(1, A1:A1, 1, TRUE())'],
    ], {useColumnIndex: true})
    const index = (engine.columnSearch as ColumnIndex)

    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)

    engine.addColumns(0, [0, 1])

    expectArrayWithSameContent([], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([0], index.getValueIndex(0, 1, 1).index)
  })
})

describe('Adding column - arrays', () => {
  it('should be possible to add column before array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-A3:C4', null, null, 'foo'],
    ], {useArrayArithmetic: true})

    engine.addColumns(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      [null, '=-B3:D4', null, null, 'foo'],
    ], {useArrayArithmetic: true})[0]

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('adding column across array should not change array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null, null, '=-A1:C1', null, null, 'foo']
    ], {useArrayArithmetic: true})

    engine.addColumns(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null, null, '=-A1:C1', null, null, null, 'foo']
    ], {useArrayArithmetic: true})[0])
  })

  it('adding column should expand dependent array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=TRANSPOSE(A1:B2)'],
      [3, 4],
    ], {useArrayArithmetic: true})

    engine.addColumns(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, null, 2, '=TRANSPOSE(A1:C2)'],
      [3, null, 4],
    ], {useArrayArithmetic: true})[0])
  })

  it('undo add column with dependent array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=TRANSPOSE(A1:B2)'],
      [3, 4],
    ], {useArrayArithmetic: true})

    engine.addColumns(0, [1, 1])
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2, '=TRANSPOSE(A1:B2)'],
      [3, 4],
    ], {useArrayArithmetic: true})[0])
  })

  it('ArrayVertex#formula should be updated', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=TRANSPOSE(A1:B2)'],
      [3, 4],
    ])

    engine.addColumns(0, [1, 1])

    expect(extractMatrixRange(engine, adr('D1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C2')))
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

    engine.addColumns(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C2')))
  })

  it('ArrayVertex#address should be updated', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=TRANSPOSE(A1:B2)'],
      [3, 4],
    ])

    engine.addColumns(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('D1')) as ArrayVertex
    expect(matrixVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('D1'))
  })
})
