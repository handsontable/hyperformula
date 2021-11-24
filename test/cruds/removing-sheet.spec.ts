import {ExportedCellChange, HyperFormula, NoSheetWithIdError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ErrorType} from '../../src/Cell'
import {ArrayVertex} from '../../src/DependencyGraph'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {CellAddress} from '../../src/parser'
import {
  adr,
  detailedErrorWithOrigin,
  expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  expectReferenceToHaveRefError,
  extractReference,
} from '../testUtils'

describe('Removing sheet - checking if its possible', () => {
  it('no if theres no such sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet(1)).toEqual(false)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet(0)).toEqual(true)
  })
})

describe('remove sheet', () => {
  it('should throw error when trying to remove not existing sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(async() => {
      await engine.removeSheet(1)
    }).rejects.toThrow(new NoSheetWithIdError(1))
  })

  it('should remove sheet by id', async() => {
const engine = await HyperFormula.buildFromArray([['foo']])

    await engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove empty sheet', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should decrease last sheet id when removing last sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    await engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet2'])
  })

  it('should not decrease last sheet id when removing sheet other than last', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
      Sheet3: [],
    })

    await engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet3'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet3', 'Sheet4'])
  })

  it('should remove sheet with matrix', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
        ['{=TRANSPOSE(A1:A1)}'],
      ],
    })

    await engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove sheet with formula matrix', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
    })

    await engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })
})

describe('remove sheet - adjust edges', () => {
  it('should not affect dependencies to sheet other than removed', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    await engine.removeSheet(1)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('should remove edge between sheets', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const a1From0 = engine.addressMapping.fetchCell(adr('A1'))
    const a1From1 = engine.addressMapping.fetchCell(adr('A1', 1))
    expect(engine.graph.existsEdge(a1From1, a1From0)).toBe(true)

    await engine.removeSheet(1)

    expect(engine.graph.existsEdge(a1From1, a1From0)).toBe(false)
  })
})

describe('remove sheet - adjust formula dependencies', () => {
  it('should not affect formula with dependency to sheet other than removed', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    await engine.removeSheet(1)

    const reference = extractReference(engine, adr('B1'))

    expect(reference).toEqual(CellAddress.relative(0, -1))
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([['1', '=A1']]))
  })

  it('should be #REF after removing sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
        ['=Sheet2!A1:A2'],
        ['=Sheet2!A:B'],
        ['=Sheet2!1:2'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    await engine.removeSheet(1)

    expectReferenceToHaveRefError(engine, adr('A1'))
    expectReferenceToHaveRefError(engine, adr('A2'))
    expectReferenceToHaveRefError(engine, adr('A3'))
    expectReferenceToHaveRefError(engine, adr('A4'))
  })

  it('should return changed values', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const changes = await engine.removeSheet(1)

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1')))
  })
})

describe('remove sheet - adjust address mapping', () => {
  it('should remove sheet from address mapping', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.removeSheet(0)

    expect(() => engine.addressMapping.strategyFor(0)).toThrowError("There's no sheet with id = 0")
  })
})

describe('remove sheet - adjust range mapping', () => {
  it('should remove ranges from range mapping when removing sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['=SUM(B1:B2)'],
        ['=SUM(C1:C2)'],
      ],
      Sheet2: [
        ['=SUM(B1:B2)'],
        ['=SUM(C1:C2)'],
      ],
    })

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)

    await engine.removeSheet(0)

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(0)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)
  })
})

describe('remove sheet - adjust matrix mapping', () => {
  it('should remove matrices from matrix mapping when removing sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['=TRANSPOSE(A1:B1)'],
      ],
      Sheet2: [
        ['1', '2'],
        ['=TRANSPOSE(A1:B1)'],
      ],
    })
    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))).toBeInstanceOf(ArrayVertex)

    await engine.removeSheet(0)

    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))).toBeUndefined()
    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2', 1), 1, 2))).toBeInstanceOf(ArrayVertex)
  })
})

describe('remove sheet - adjust column index', () => {
  it('should remove sheet from index', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ], { useColumnIndex: true })
    const index = engine.columnSearch as ColumnIndex
    const removeSheetSpy = spyOn(index, 'removeSheet')

    await engine.removeSheet(0)

    expect(removeSheetSpy).toHaveBeenCalled()
    expectArrayWithSameContent([], index.getValueIndex(0, 0, 1).index)
  })
})
