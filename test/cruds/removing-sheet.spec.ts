import {buildConfig, HyperFormula, ExportedCellChange} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ErrorType, simpleCellAddress} from '../../src/Cell'
import {ColumnIndex} from '../../src/ColumnSearch/ColumnIndex'
import {MatrixVertex} from '../../src/DependencyGraph'
import {NoSheetWithNameError} from '../../src'
import {CellAddress} from '../../src/parser'
import '../testConfig'
import {
  adr, detailedError,
  expectArrayWithSameContent,
  expectReferenceToHaveRefError,
  expectEngineToBeTheSameAs,
  extractReference,
} from '../testUtils'

describe('Removing sheet - checking if its possible', () => {
  it('no if theres no such sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet('foo')).toEqual(false)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet('Sheet1')).toEqual(true)
  })
})

describe('remove sheet', () => {
  it('should throw error when trying to remove not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(() => {
      engine.removeSheet('foo')
    }).toThrow(new NoSheetWithNameError('foo'))
  })

  it('should remove sheet by name', () => {
    const engine = HyperFormula.buildFromArray([['foo']])

    engine.removeSheet('Sheet1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('can remove sheet by any kind of case in name', () => {
    const engine = HyperFormula.buildFromArray([['foo']])

    engine.removeSheet('SHEET1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.removeSheet('Sheet1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should decrease last sheet id when removing last sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    engine.removeSheet('Sheet2')

    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet2'])
  })

  it('should not decrease last sheet id when removing sheet other than last', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
      Sheet3: [],
    })

    engine.removeSheet('Sheet2')

    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet3'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet3', 'Sheet4'])
  })

  it('should remove sheet with matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
        ['{=TRANSPOSE(A1:A1)}'],
      ],
    })

    engine.removeSheet('Sheet1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove sheet with formula matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
    })

    engine.removeSheet('Sheet1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove sheet with numeric matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
      ],
    }, buildConfig({ matrixDetection: true, matrixDetectionThreshold: 1 }))

    engine.removeSheet('Sheet1')

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })
})

describe('remove sheet - adjust edges', () => {
  it('should not affect dependencies to sheet other than removed', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet('Sheet2')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('should remove edge between sheets', () => {
    const engine = HyperFormula.buildFromSheets({
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

    engine.removeSheet('Sheet2')

    expect(engine.graph.existsEdge(a1From1, a1From0)).toBe(false)
  })
})

describe('remove sheet - adjust formula dependencies', () => {
  it('should not affect formula with dependency to sheet other than removed', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet('Sheet2')

    const reference = extractReference(engine, adr('B1'))

    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([['1', '=A1']]))
  })

  it('should be #REF after removing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet('Sheet2')

    expectReferenceToHaveRefError(engine, adr('A1'))
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([['=Sheet2!A1']]))
  })

  it('should return changed values', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const changes = engine.removeSheet('Sheet2')

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 0, 0), detailedError(ErrorType.REF)))
  })
})

describe('remove sheet - adjust address mapping', () => {
  it('should remove sheet from address mapping', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.removeSheet('Sheet1')

    expect(() => engine.addressMapping.strategyFor(0)).toThrow(new Error('Unknown sheet id'))
  })
})

describe('remove sheet - adjust range mapping', () => {
  it('should remove ranges from range mapping when removing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
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

    engine.removeSheet('Sheet1')

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(0)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)
  })
})

describe('remove sheet - adjust matrix mapping', () => {
  it('should remove matrices from matrix mapping when removing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:A1)}'],
        ['{=TRANSPOSE(A2:A2)}'],
      ],
      Sheet2: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:A1)}'],
        ['{=TRANSPOSE(A2:A2)}'],
      ],
    })
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 1))).toBeInstanceOf(MatrixVertex)
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A3'), 1, 1))).toBeInstanceOf(MatrixVertex)

    engine.removeSheet('Sheet1')

    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 1))).toBeUndefined()
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A3'), 1, 1))).toBeUndefined()
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2', 1), 1, 1))).toBeInstanceOf(MatrixVertex)
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A3', 1), 1, 1))).toBeInstanceOf(MatrixVertex)
  })
})

describe('remove sheet - adjust column index', () => {
  it('should remove sheet from index', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ], buildConfig({ useColumnIndex: true }))
    const index = engine.columnSearch as ColumnIndex
    const removeSheetSpy = jest.spyOn(index, 'removeSheet')

    engine.removeSheet('Sheet1')

    expect(removeSheetSpy).toHaveBeenCalled()
    expectArrayWithSameContent([], index.getValueIndex(0, 0, 1).index)
  })
})
