import {ExportedCellChange, HyperFormula, SheetSizeLimitExceededError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {Config} from '../../src/Config'
import {ArrayVertex, FormulaCellVertex} from '../../src/DependencyGraph'
import {AlwaysDense} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {adr, expectArrayWithSameContent, expectEngineToBeTheSameAs, extractMatrixRange} from '../testUtils'

describe('Adding row - checking if its possible', () => {
  it('no if starting row is negative', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [-1, 1])).toEqual(false)
  })

  it('no if starting row is not an integer', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [1.5, 1])).toEqual(false)
  })

  it('no if starting row is NaN', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [NaN, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [Infinity, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [-Infinity, 1])).toEqual(false)
  })

  it('no if number of rows is not positive', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 0])).toEqual(false)
  })

  it('no if number of rows is not an integer', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1.5])).toEqual(false)
  })

  it('no if number of rows is NaN', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToAddRows(-Infinity, [0, 1])).toEqual(false)
  })

  it('no if adding row would exceed sheet size limit', async() => {
const engine = await HyperFormula.buildFromArray(
      Array(Config.defaultConfig.maxRows - 1).fill([''])
    )

    expect(engine.isItPossibleToAddRows(0, [0, 2])).toEqual(false)
    expect(engine.isItPossibleToAddRows(0, [0, 1], [5, 1])).toEqual(false)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToAddRows(0, [0, 1])).toEqual(true)
  })
})

describe('Adding row - matrix', () => {
  it('should be possible to add row crossing matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      ['bar'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    await engine.addRows(0, [3, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      [null],
      ['bar'],
    ]))
  })

  it('should adjust matrix address mapping when adding multiple rows', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      ['bar'],
    ], {chooseAddressMappingPolicy: new AlwaysDense()})

    await engine.addRows(0, [3, 3])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['foo', '=TRANSPOSE(A1:C2)'],
      [null],
      [null],
      [null],
      ['bar'],
    ]))
  })

  it('should be possible to add row right above matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=TRANSPOSE(A3:B4)'],
      [],
      ['1', '2'],
      ['3', '4'],
    ])

    await engine.addRows(0, [0, 1])

    expect(engine.getCellValue(adr('A1'))).toBe(null)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('should be possible to add row right after matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=TRANSPOSE(A3:B4)'],
      [],
      ['1', '2'],
      ['3', '4'],
    ])

    await engine.addRows(0, [2, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })
})

describe('Adding row - reevaluation', () => {
  it('reevaluates cells', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)'],
      // new row
      ['2'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    await engine.addRows(0, [1, 1])
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('dont reevaluate everything', async() => {
const engine = await HyperFormula.buildFromArray([
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

    await engine.addRows(0, [1, 1])

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', async() => {
const engine = await HyperFormula.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    await engine.addRows(0, [0, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('returns changed values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])
    
    const changes = await engine.addRows(0, [1, 1])

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('B3'), 1))
  })
})

describe('Adding row - FormulaCellVertex#address update', () => {
  it('insert row, formula vertex address shifted', async() => {
const engine = await HyperFormula.buildFromArray([
      // new row
      ['=SUM(1,2)'],
    ])

    let vertex = engine.addressMapping.fetchCell(adr('A1')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1'))
    await engine.addRows(0, [0, 1])
    vertex = engine.addressMapping.fetchCell(adr('A2')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A2'))
  })

  it('adding row in different sheet but same row as formula should not update formula address', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        // new row
        ['1'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
      ],
    })

    await engine.addRows(0, [0, 1])

    const formulaVertex = engine.addressMapping.fetchCell(adr('A1', 1)) as FormulaCellVertex

    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1', 1))
  })
})

describe('Adding row - address mapping', () => {
  it('verify sheet dimensions', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      // new row
      ['2'],
    ])

    await engine.addRows(0, [1, 1])

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 3,
    })
  })
})

describe('Adding row - sheet dimensions', () => {
  it('should do nothing when adding row outside effective sheet', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      // new row
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = spyOn(engine.evaluator as any, 'partialRun')
    await engine.addRows(0, [1, 1])
    await engine.addRows(0, [10, 15])

    expect(recalcSpy).not.toHaveBeenCalled()
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to expand sheet beyond limits', async() => {
const engine = await HyperFormula.buildFromArray(Array(Config.defaultConfig.maxRows - 1).fill(['']))

    expect(async() => {
      await engine.addRows(0, [0, 2])
    }).rejects.toThrow(new SheetSizeLimitExceededError())

    expect(async() => {
      await engine.addRows(0, [0, 1], [5, 1])
    }).rejects.toThrow(new SheetSizeLimitExceededError())
  })
})

describe('Adding row - column index', () => {
  it('should update column index when adding row', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=VLOOKUP(2, A1:A10, 1, TRUE())'],
      ['2'],
    ], {useColumnIndex: true})

    await engine.addRows(0, [1, 1])

    const index = (engine.columnSearch as ColumnIndex)
    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)
    expectArrayWithSameContent([2], index.getValueIndex(0, 0, 2).index)
  })
})

describe('Adding row - arrays', () => {
  it('should be possible to add row above array', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    await engine.addRows(0, [0, 1])

    const expected = await HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('adding row across array should not change array', async() => {
const engine = await HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], {useArrayArithmetic: true})

    await engine.addRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], {useArrayArithmetic: true}))
  })

  it('adding row should expand dependent array', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    await engine.addRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], {useArrayArithmetic: true}))
  })

  it('undo add row with dependent array', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    await engine.addRows(0, [1, 1])
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true}))
  })

  it('ArrayVertex#formula should be updated', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    await engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A4'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('ArrayVertex#formula should be updated when different sheets', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4'],
      ],
      Sheet2: [
        ['=TRANSPOSE(Sheet1!A1:B2)'],
      ],
    })

    await engine.addRows(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('ArrayVertex#address should be updated', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    await engine.addRows(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('A4')) as ArrayVertex
    expect(matrixVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A4'))
  })
})
