import {ExportedCellChange, HyperFormula, SheetSizeLimitExceededError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {Config} from '../../src/Config'
import {ArrayVertex, FormulaCellVertex} from '../../src/DependencyGraph'
import {AlwaysDense} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {adr, expectArrayWithSameContent, expectEngineToBeTheSameAs, extractMatrixRange} from '../testUtils'

describe('Adding row - checking if its possible', () => {
  it('no if starting row is negative', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [-1, 1])).toEqual(false)
  })

  it('no if starting row is not an integer', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [1.5, 1])).toEqual(false)
  })

  it('no if starting row is NaN', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [NaN, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [Infinity, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [-Infinity, 1])).toEqual(false)
  })

  it('no if number of rows is not positive', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 0])).toEqual(false)
  })

  it('no if number of rows is not an integer', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1.5])).toEqual(false)
  })

  it('no if number of rows is NaN', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-Infinity, [0, 1])).toEqual(false)
  })

  it('no if adding row would exceed sheet size limit', () => {
    const [engine] = HyperFormula.buildFromArray(
      Array(Config.defaultConfig.maxRows - 1).fill([''])
    )

    expect(engine.isItPossibleToAddRows(0, [0, 2])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, 1], [5, 1])).toEqual(false)
  })

  it('yes otherwise', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1])).toEqual(true)
  })
})

describe('Adding row - matrix', () => {
  it('should be possible to add row crossing matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      ['bar'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    engine.addRows(0, [3, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      [null],
      ['bar'],
    ])[0])
  })

  it('should adjust matrix address mapping when adding multiple rows', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      ['bar'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    engine.addRows(0, [3, 3])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      [null],
      [null],
      [null],
      ['bar'],
    ])[0])
  })

  it('should be possible to add row right above matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(A3:B4)'],
      [],
      ['1', '2'],
      ['3', '4'],
    ])

    engine.addRows(0, [0, 1])

    expect(engine.getCellValue(adr('A1'))).toBe(null)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('should be possible to add row right after matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(A3:B4)'],
      [],
      ['1', '2'],
      ['3', '4'],
    ])

    engine.addRows(0, [2, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })
})

describe('Adding row - reevaluation', () => {
  it('reevaluates cells', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)'],
      // new row
      ['2'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    engine.addRows(0, [1, 1])
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)', '=SUM(A1:A1)'],
      // new row
      ['2'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1setCellValueSpy = spyOn(b1 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, [1, 1])

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const [engine] = HyperFormula.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, [0, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('returns changed values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])

    const [changes] = engine.addRows(0, [1, 1])

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('B3'), 1))
  })
})

describe('Adding row - FormulaCellVertex#address update', () => {
  it('insert row, formula vertex address shifted', () => {
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromSheets({
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

    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
  })
})

describe('Adding row - address mapping', () => {
  it('verify sheet dimensions', () => {
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      // new row
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = spyOn(engine.evaluator as any, 'partialRun')
    engine.addRows(0, [1, 1])
    engine.addRows(0, [10, 15])

    expect(recalcSpy).not.toHaveBeenCalled()
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to expand sheet beyond limits', () => {
    const [engine] = HyperFormula.buildFromArray(Array(Config.defaultConfig.maxRows - 1).fill(['']))

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
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=VLOOKUP(2, A1:A10, 1, TRUE())'],
      ['2'],
    ], {useColumnIndex: true})

    engine.addRows(0, [1, 1])

    const index = (engine.columnSearch as ColumnIndex)
    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([2], index.getValueIndex(0, 0, 2).index)
  })
})

describe('Adding row - arrays', () => {
  it('should be possible to add row above array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})[0]

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('adding row across array should not change array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], {useArrayArithmetic: true})[0])
  })

  it('adding row should expand dependent array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], {useArrayArithmetic: true})[0])
  })

  it('undo add row with dependent array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [1, 1])
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})[0])
  })

  it('ArrayVertex#formula should be updated', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A4'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
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

    engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('ArrayVertex#address should be updated', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    engine.addRows(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('A4')) as ArrayVertex
    expect(matrixVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A4'))
  })
})
