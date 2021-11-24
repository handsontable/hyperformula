import {ExportedCellChange, HyperFormula} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ArrayVertex, RangeVertex} from '../../src/DependencyGraph'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {CellAddress} from '../../src/parser'
import {
  adr,
  expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  expectFunctionToHaveRefError,
  expectReferenceToHaveRefError,
  extractMatrixRange,
  extractRange,
  extractReference,
  noSpace,
  verifyRangesInSheet,
  verifyValues,
} from '../testUtils'

describe('Removing columns - checking if its possible', () => {
  it('no if starting column is negative', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(0, [-1, 1])).toEqual(false)
  })

  it('no if starting column is not an integer', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(0, [1.5, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [NaN, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [Infinity, 2])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [-Infinity, 2])).toEqual(false)
  })

  it('no if number of columns is negative', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(0, [0, -1])).toEqual(false)
  })

  it('no if number of columns is not an integer', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(0, [0, 1.5])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [0, NaN])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [0, Infinity])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(0, [0, -Infinity])).toEqual(false)
  })

  it('no if sheet does not exist', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(1.5, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(-1, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(NaN, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(Infinity, [0, 1])).toEqual(false)
    expect(engine.isItPossibleToRemoveColumns(-Infinity, [0, 1])).toEqual(false)
  })

  it('yes if theres an array in place where we remove', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=TRANSPOSE(A1:B2)'],
      ['3', '4'],
    ])

    expect(engine.isItPossibleToRemoveColumns(0, [1, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [1, 2])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [2, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [3, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [4, 1])).toEqual(true)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveColumns(0, [0, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [1, 1])).toEqual(true)
    expect(engine.isItPossibleToRemoveColumns(0, [1, 2])).toEqual(true)
  })
})

describe('Address dependencies, Case 1: same sheet', () => {
  it('case Aa: absolute dependency before removed column should not be affected', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '', '=$B1'],
    ])

    await engine.removeColumns(0, [2, 1])

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol( 1, 0))
  })

  it('case Ab: absolute dependency after removed column should be shifted', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=$C1', '', '42'],
    ])

    await engine.removeColumns(0, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol( 1, 0))
  })

  it('case Ac: absolute dependency in removed column range should be replaced by #REF', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=$B1', ''],
    ])

    await engine.removeColumns(0, [1, 1])

    expectReferenceToHaveRefError(engine, adr('A1'))
  })

  it('case Raa: relative dependency and formula before removed columns should not be affected', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42', '=A1', '2'],
    ])

    await engine.removeColumns(0, [2, 1])

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1))
  })

  it('case Rab: relative address should be shifted when only formula is moving', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42', '1', '2', '=A1'],
    ])

    await engine.removeColumns(0, [1, 2])

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, -1))
  })

  it('case Rba: relative address should be shifted when only dependency is moving', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=D1', '1', '2', '42'],
    ])

    await engine.removeColumns(0, [1, 2])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1))
  })

  it('case Rbb: relative address should not be affected when dependency and formula is moving', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=D1', '42'],
    ])

    await engine.removeColumns(0, [0, 2])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1))
  })

  it('case Rca: relative dependency in deleted column range should be replaced by #REF', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=C1', '1', '2', '3'],
    ])

    await engine.removeColumns(0, [1, 2])

    expectReferenceToHaveRefError(engine, adr('A1'))
  })

  it('case Rcb: relative dependency in deleted column range should be replaced by #REF', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=B1'],
    ])

    await engine.removeColumns(0, [0, 2])

    expectReferenceToHaveRefError(engine, adr('B1'))
  })

  it('case Rca, range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B1:C1)', '1', '2'],
    ])

    await engine.removeColumns(0, [1, 2])

    expectFunctionToHaveRefError(engine, adr('A1'))
  })

  it('truncates range by one column from left if first column removed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    await engine.removeColumns(0, [0, 1])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('A1')))
  })

  it('truncates range by one column from right if last column removed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    await engine.removeColumns(0, [1, 1])

    expect(extractRange(engine, adr('B1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('A1')))
  })

  it('truncates range by columns from left if leftmost columns removed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '2', '3', '4'],
      ['=SUM(B1:E1)'],
    ])

    await engine.removeColumns(0, [1, 2])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from left if leftmost columns removed - removing does not have to start with range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '', '1', '2', '3', '4'],
      ['=SUM(C1:F1)'],
    ])

    await engine.removeColumns(0, [1, 3])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from left if leftmost columns removed - removing does not have to start with range but may end on start', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '', '1', '2', '3', '4'],
      ['=SUM(C1:F1)'],
    ])

    await engine.removeColumns(0, [1, 2])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('D1')))
  })

  it('truncates range by columns from right if rightmost columns removed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '2', '3', '4'],
      ['=SUM(B1:E1)'],
    ])

    await engine.removeColumns(0, [3, 2])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from right if rightmost columns removed - removing does not have to end with range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '2', '3', '4', ''],
      ['=SUM(B1:E1)'],
    ])

    await engine.removeColumns(0, [3, 3])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })

  it('truncates range by columns from right if rightmost columns removed - removing does not have to end with range but may start on end', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '2', '3', '4', ''],
      ['=SUM(B1:E1)'],
    ])

    await engine.removeColumns(0, [4, 2])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('D1')))
  })
})

describe('Address dependencies, Case 2: formula in sheet where we make crud with dependency to other sheet', () => {
  it('case A: should not affect absolute dependencies', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=Sheet2!$A1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    await engine.removeColumns(0, [0, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol( 0, 0, 1))
  })

  it('case Ra: removing column before formula should shift dependency', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=Sheet2!A1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    await engine.removeColumns(0, [0, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('case Rb: removing column after formula should not affect dependency', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1', '1'],
      ],
      Sheet2: [
        ['2'],
      ],
    })

    await engine.removeColumns(0, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
  })
})

describe('Address dependencies, Case 3: formula in different sheet', () => {
  it('case ARa: relative/absolute dependency after removed column should be shifted ', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!C1', '=Sheet2!C1', '=Sheet2!C1', '=Sheet2!$C1'],
      ],
      Sheet2: [
        ['1', '2', '3'],
      ],
    })

    await engine.removeColumns(1, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 1))
    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.relative(0, 0, 1))
    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.relative(0, -1, 1))
    expect(extractReference(engine, adr('D1'))).toEqual(CellAddress.absoluteCol( 1, 0, 1))
  })

  it('case ARb: relative/absolute dependency before removed column should not be affected', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1', '=Sheet2!$A1'],
      ],
      Sheet2: [
        ['0', '1'],
      ],
    })

    await engine.removeColumns(1, [1, 1])

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.absoluteCol( 0, 0, 1))
  })

  it('case ARc: relative/absolute dependency in removed range should be replaced by #REF', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!$A1', '=Sheet2!A1'],
      ],
      Sheet2: [
        ['1', '2'],
      ],
    })

    await engine.removeColumns(1, [0, 1])

    expectReferenceToHaveRefError(engine, adr('A1'))
    expectReferenceToHaveRefError(engine, adr('B1'))
  })

  it('does not truncate any ranges if columns are removed from different sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['', '2', '3'],
        ['=SUM(B1:C1)'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    await engine.removeColumns(1, [1, 1])

    expect(extractRange(engine, adr('A2'))).toEqual(new AbsoluteCellRange(adr('B1'), adr('C1')))
  })
})

describe('Address dependencies, Case 4: remove columns in sheet different than formula or dependency sheet', () => {
  it('should not affect dependency when removing columns in not relevant sheet', async() => {
    const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['1', '=A1'],
      ],
    })

    await engine.removeColumns(0, [0, 1])

    expect(extractReference(engine, adr('B1', 1))).toEqual(CellAddress.relative(0, -1))
  })

  it('should not affect dependency when removing columns in not relevant sheet, more sheets', async() => {
    const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['foo'],
      ],
      Sheet3: [
        ['1', '=Sheet2!A1'],
      ],
    })

    await engine.removeColumns(0, [0, 1])

    expect(extractReference(engine, adr('B1', 2))).toEqual(CellAddress.relative(0, -1, 1))
  })
})

describe('Removing columns - reevaluation', () => {
  it('reevaluates', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=MEDIAN(B1:D1)', '2', '4', '3'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(3)

    await engine.removeColumns(0, [2, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(2.5)
  })

  it('dont reevaluate everything', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '', '3'],
      ['=COUNTBLANK(A1:C1)'],
      ['=SUM(A1:A1)'],
    ])
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const a3 = engine.addressMapping.getCell(adr('A3'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a2setCellValueSpy = spyOn(a2 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a3setCellValueSpy = spyOn(a3 as any, 'setCellValue')

    await engine.removeColumns(0, [1, 1])

    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(a3setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=COLUMNS(A1:C1)'],
    ])
    const d1 = engine.addressMapping.getCell(adr('D1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d1setCellValueSpy = spyOn(d1 as any, 'setCellValue')

    await engine.removeColumns(0, [1, 1])

    expect(d1setCellValueSpy).toHaveBeenCalled()
    expect(extractRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B1')))
  })

  it('should reevaluate formula when range reduced to zero', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    await engine.removeColumns(0, [0, 2])

    expect(c1setCellValueSpy).toHaveBeenCalled()
    expectFunctionToHaveRefError(engine, adr('A1'))
  })

  it('returns changed values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:B1)'],
    ])

    const changes = await engine.removeColumns(0, [0, 1])

    expect(changes.length).toBe(1)
    expect(changes).toEqual([new ExportedCellChange(adr('B1'), 2)])
  })
})

describe('Removing rows - arrays', () => {
  it('ArrayVertex#formula should be updated', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=TRANSPOSE(A1:C2)'],
      ['4', '5', '6'],
    ])

    await engine.removeColumns(0, [1, 1])

    expect(extractMatrixRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })

  it('ArrayVertex#address should be updated', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=TRANSPOSE(A1:C2)'],
      ['4', '5', '6'],
    ])

    await engine.removeColumns(0, [1, 1])

    const matrixVertex = engine.addressMapping.fetchCell(adr('C1')) as ArrayVertex
    expect(matrixVertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('C1'))
  })

  it('ArrayVertex#formula should be updated when different sheets', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2', '3'],
        ['4', '5', '6'],
      ],
      Sheet2: [
        ['=TRANSPOSE(Sheet1!A1:C2)'],
      ],
    })

    await engine.removeColumns(0, [1, 1])

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B2')))
  })

  it('should be possible to remove column before array', async() => {
const engine = await HyperFormula.buildFromArray([
      [null, '=-B3:D4', null, null, 'foo'],
    ], {useArrayArithmetic: true})

    await engine.removeColumns(0, [0, 1])

    const expected = await HyperFormula.buildFromArray([
      ['=-A3:C4', null, null, 'foo'],
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('removing column across array should not change array', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C2', null, null, null, 'foo'],
      [4, 5, 6]
    ], {useArrayArithmetic: true})

    await engine.removeColumns(0, [4, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C2', null, null, 'foo'],
      [4, 5, 6]
    ], {useArrayArithmetic: true}))
  })

  it('removing column should shrink dependent array', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, null, 3, '=TRANSPOSE(A1:C2)'],
      [2, null, 4],
    ], {useArrayArithmetic: true})

    await engine.removeColumns(0, [1, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 3, '=TRANSPOSE(A1:B2)'],
      [2, 4],
    ], {useArrayArithmetic: true}))
  })

  it('it should be REF if no space after removing column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=-C2:D2', null, 1],
      [null, null, 1, 2]
    ], {useArrayArithmetic: true})

    await engine.removeColumns(0, [1, 1])

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1],
      [null, 1, 2],
    ])

    const expected = await HyperFormula.buildFromArray([
      ['=-B2:C2', 1],
      [null, 1, 2]
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('it should be REF, not CYCLE, after removing columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=-C1:D1', null, 1, 2]
    ], {useArrayArithmetic: true})

    await engine.removeColumns(0, [1, 1])

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1, 2],
    ])

    const expected = await HyperFormula.buildFromArray([
      ['=-B1:C1', 1, 2],
    ], {useArrayArithmetic: true})
    expectEngineToBeTheSameAs(engine, expected)
  })

  it('it should remove array when removing column with left corner', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=MMULT(A1:B2, A1:B2)'],
      ['3', '4'],
    ])

    await engine.removeColumns(0, [2, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4]
    ]))
  })

  it('it should remove array when removing columns with whole matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=MMULT(A1:B2, A1:B2)'],
      ['3', '4'],
    ])

    await engine.removeColumns(0, [2, 2])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4]
    ]))
  })
})

describe('Removing columns - graph', () => {
  it('should remove edges from other cells to removed nodes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=B1'],
    ])

    await engine.removeColumns(0, [2, 1])

    const b1 = engine.addressMapping.fetchCell(adr('b1'))
    expect(engine.graph.adjacentNodes(b1)).toEqual(new Set())
  })

  it('should remove vertices from graph', async() => {
    const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4'],
      ['1', '2', '3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(8)
    await engine.removeColumns(0, [0, 2])
    expect(engine.graph.nodes.size).toBe(4) // left two vertices in first column, two in last
  })

  it('works if there are empty cells removed', async() => {
    const engine = await HyperFormula.buildFromArray([
      ['1', null, '3'],
    ])
    expect(engine.graph.nodes.size).toBe(2)
    await engine.removeColumns(0, [1, 1])
    expect(engine.graph.nodes.size).toBe(2)
  })
})

describe('Removing columns - dependencies', () => {
  it('should not affect absolute dependencies to other sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2', '=Sheet2!$A1'],
        /*      */
      ],
      Sheet2: [
        ['3'],
        ['4'],
      ],
    })

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol( 0, 0, 1))
    await engine.removeColumns(0, [0, 2])
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol( 0, 0, 1))
  })

})

describe('Removing columns - ranges', () => {
  it('shift ranges in range mapping, range start at right of removed columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['', '=SUM(B1:C1)', ''],
      /**/
    ])

    await engine.removeColumns(0, [0, 1])

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('B1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, range start before removed columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['=SUM(A1:C1)', '', ''],
      /*   */
    ])

    await engine.removeColumns(0, [1, 2])

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A1'))
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(a1, range)).toBe(true)
  })

  it('shift ranges in range mapping, whole range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=SUM(A1:C1)'],
      /*          */
    ])
    const range = engine.rangeMapping.getRange(adr('A1'), adr('C1')) as RangeVertex

    await engine.removeColumns(0, [0, 3])

    const ranges = Array.from(engine.rangeMapping.rangesInSheet(0))
    expect(ranges.length).toBe(0)
    expect(engine.graph.hasNode(range)).toBe(false)
  })

  it('does not truncate any ranges if columns are removed from different sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2', '=SUM(A1:B1)'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    await engine.removeColumns(1, [0, 1])

    expect(extractRange(engine, adr('C1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B1')))
  })
})

describe('Removing columns - sheet dimensions', () => {
  it('should do nothing when removing column outside effective sheet', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recalcSpy = spyOn(engine.evaluator as any, 'partialRun')
    await engine.removeColumns(0, [1, 1])
    await engine.removeColumns(0, [10, 6])

    expect(recalcSpy).not.toHaveBeenCalled()
    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('should throw error when trying to remove non positive number of columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(async() => await engine.removeColumns(0, [1, 0])).rejects.toThrowError()
  })
})

describe('Removing columns - column index', () => {
  it('should update column index when adding column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['', '1', '=VLOOKUP(2, A1:A10, 1, TRUE())'],
    ], { useColumnIndex: true })

    await engine.removeColumns(0, [0, 1])

    const index = (engine.columnSearch as ColumnIndex)
    expectArrayWithSameContent([0], index.getValueIndex(0, 0, 1).index)
  })
})

describe('Removing columns - column range', () => {
  it('removing column in the middle of column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=SUM(A:C)']
    ])

    await engine.removeColumns(0, [1, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['1', '3', '=SUM(A:B)']
    ]))
  })

  it('removing column in at the start of column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=SUM(A:C)']
    ])

    await engine.removeColumns(0, [0, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['2', '3', '=SUM(A:B)']
    ]))
  })

  it('removing column in at the end of column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=SUM(A:C)']
    ])

    await engine.removeColumns(0, [2, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ]))
  })
})

describe('Removing columns - row range', () => {
  it('should not affect row range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1', '1'],
      ['2', '2', '2'],
      [null, null, '=SUM(1:2)']
    ])

    await engine.removeColumns(0, [0, 1])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      [null, '=SUM(1:2)']
    ]))
  })
})

describe('Removing columns - merge ranges', () => {
  it('should merge ranges', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents({sheet: 0, col: 1, row: 2}, 7)
    await engine.setCellContents({sheet: 0, col: 0, row: 3}, '=SUM(B2:C3)')
    await engine.setCellContents({sheet: 0, col: 0, row: 6}, '=SUM(A4:B6)')
    await engine.setCellContents({sheet: 0, col: 2, row: 6}, '=SUM(A4:A6)')

    verifyRangesInSheet(engine, 0, ['A4:A6', 'A4:B6', 'B2:C3'])
    await verifyValues(engine)

    await engine.addColumns(0, [0, 2])

    verifyRangesInSheet(engine, 0, ['C4:C6', 'C4:D6', 'D2:E3'])
    await verifyValues(engine)

    await engine.removeColumns(0, [3, 1])

    verifyRangesInSheet(engine, 0, ['C4:C6', 'D2:D3'])
    await verifyValues(engine)
  })

  it('Should properly deallocate all nodes', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents({sheet: 0, col: 2, row: 3}, '=SUM(B2:C2)')
    await engine.setCellContents({sheet: 0, col: 3, row: 5}, '=SUM(B2:C3)')

    await engine.addColumns(0, [2, 2])
    await engine.removeColumns(0, [4, 1])

    verifyRangesInSheet(engine, 0, ['B2:D2', 'B2:D3'])
    await verifyValues(engine)

    await engine.setCellContents({sheet: 0, col: 4, row: 5}, null)

    verifyRangesInSheet(engine, 0, [])
    await verifyValues(engine)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should merge ranges in proper order', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents({sheet: 0, col: 0, row: 0}, '=SUM(D5:F5)')
    await engine.setCellContents({sheet: 0, col: 1, row: 0}, '=SUM(D5:E5)')
    await engine.setCellContents({sheet: 0, col: 2, row: 0}, '=SUM(D5:D5)')

    await engine.removeColumns(0, [4, 1])

    verifyRangesInSheet(engine, 0, ['D5:E5', 'D5:D5'])
    await verifyValues(engine)

    await engine.setCellContents(adr('A1'), null)
    await engine.setCellContents(adr('B1'), null)
    await engine.setCellContents(adr('C1'), null)

    verifyRangesInSheet(engine, 0, [])
    await verifyValues(engine)
  })

  it('should merge ranges when removing multiple columns', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents({sheet: 0, col: 3, row: 0}, '=SUM(A5:A5)')
    await engine.setCellContents({sheet: 0, col: 0, row: 0}, '=SUM(A5:C5)')

    verifyRangesInSheet(engine, 0, ['A5:A5', 'A5:C5'])

    await engine.removeColumns(0, [1, 2])

    verifyRangesInSheet(engine, 0, ['A5:A5'])
    await verifyValues(engine)

    await engine.setCellContents(adr('A1'), null)
    await engine.setCellContents(adr('B1'), null)

    verifyRangesInSheet(engine, 0, [])
    await verifyValues(engine)
  })

  it('should undo merge ranges', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents({sheet: 0, col: 2, row: 1}, 7)
    await engine.setCellContents({sheet: 0, col: 3, row: 0}, '=SUM(B2:C3)')
    await engine.setCellContents({sheet: 0, col: 6, row: 0}, '=SUM(A4:B6)')
    await engine.setCellContents({sheet: 0, col: 6, row: 2}, '=SUM(A4:A6)')

    await engine.addColumns(0, [0, 2])
    await engine.removeColumns(0, [3, 1])

    verifyRangesInSheet(engine, 0, ['C4:C6', 'D2:D3'])
    await verifyValues(engine)

    await engine.undo()

    verifyRangesInSheet(engine, 0, ['C4:C6', 'C4:D6', 'D2:E3'])

    await verifyValues(engine)
  })
})
