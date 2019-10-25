import {CellError, HandsOnEngine} from '../../src'
import {CellAddress} from '../../src/parser'
import '../testConfig'
import {adr, expect_reference_to_have_ref_error, expectEngineToBeTheSameAs, extractReference} from '../testUtils'
import {AbsoluteCellRange} from "../../src/AbsoluteCellRange";
import {MatrixVertex} from "../../src/DependencyGraph";
import {ErrorType} from "../../src/Cell";

describe('remove sheet', () => {
  it('should remove sheet by id', () => {
    const engine = HandsOnEngine.buildFromArray([['foo']])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove empty sheet', () => {
    const engine = HandsOnEngine.buildFromArray([])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should decrease last sheet id when removing last sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet2'])
  })

  it('should not decrease last sheet id when removing sheet other than last', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
      Sheet3: [],
    })

    engine.removeSheet(1)

    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet3'])
    engine.addSheet()
    expect(Array.from(engine.sheetMapping.names())).toEqual(['Sheet1', 'Sheet3', 'Sheet4'])
  })

  it('should remove sheet with matrix', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
          ['1'],
          ['{=TRANSPOSE(A1:A1)}']
      ]
    })

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })
})

describe('remove sheet - adjust edges', () => {
  it('should not affect dependencies to sheet other than removed', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet(1)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('should remove edge between sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const a1_1 = engine.addressMapping.fetchCell(adr('A1'))
    const a1_2 = engine.addressMapping.fetchCell(adr('A1', 1))
    expect(engine.graph.existsEdge(a1_2, a1_1)).toBe(true)

    engine.removeSheet(1)

    expect(engine.graph.existsEdge(a1_2, a1_1)).toBe(false)
  })
})

describe('remove sheet - adjust formula dependencies', () => {
  it('should not affect formula with dependency to sheet other than removed', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet(1)

    const reference = extractReference(engine, adr('B1'))

    expect(reference).toEqual(CellAddress.relative(0, -1, 0))
    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([['1', '=A1']]))
  })

  it('should be #REF after removing sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet(1)

    expect_reference_to_have_ref_error(engine, adr('A1'))
    expectEngineToBeTheSameAs(engine, HandsOnEngine.buildFromArray([['=$Sheet2.A1']]))
  })

  it('should return changed values', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const changes = engine.removeSheet(1)

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual({ sheet: 0, row: 0, col: 0, value: new CellError(ErrorType.REF) })
  })
})

describe('remove sheet - adjust address mapping', () => {
  it('should remove sheet from address mapping', () => {
    const engine = HandsOnEngine.buildFromArray([])

    engine.removeSheet(0)

    expect(() => engine.addressMapping.strategyFor(0)).toThrow(new Error('Unknown sheet id'))
  })
})

describe('remove sheet - adjust range mapping', () => {
  it('should remove ranges from range mapping when removing sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
          ['=SUM(B1:B2)'],
          ['=SUM(C1:C2)'],
      ],
      'Sheet2': [
        ['=SUM(B1:B2)'],
        ['=SUM(C1:C2)'],
      ]
    })

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)

    engine.removeSheet(0)

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(0)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)
  });
})

describe('remove sheet - adjust matrix mapping', () => {
  it('should remove matrices from matrix mapping when removing sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      'Sheet1': [
        ['1', '2'],
        ['{=TRANSPOSE(A1:A1)}'],
        ['{=TRANSPOSE(A2:A2)}']
      ],
      'Sheet2': [
        ['1', '2'],
        ['{=TRANSPOSE(A1:A1)}'],
        ['{=TRANSPOSE(A2:A2)}']
      ]
    })
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A2"), 1, 1))).toBeInstanceOf(MatrixVertex)
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A3"), 1, 1))).toBeInstanceOf(MatrixVertex)

    engine.removeSheet(0)

    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A2"), 1, 1))).toBeUndefined()
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A3"), 1, 1))).toBeUndefined()
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A2", 1), 1, 1))).toBeInstanceOf(MatrixVertex)
    expect(engine.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr("A3", 1), 1, 1))).toBeInstanceOf(MatrixVertex)
  });
})
