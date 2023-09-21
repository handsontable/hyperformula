import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {adr, colEnd, colStart, extractColumnRange} from './testUtils'

describe('Column ranges', () => {
  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })

  it('should create correct edges for infinite range when building graph', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(C:D)', '=SUM(C5:D6)'],
    ])

    const cd = engine.rangeMapping.getRange(colStart('C'), colEnd('D'))!

    const c5 = engine.dependencyGraph.fetchCell(adr('C5'))
    const c6 = engine.dependencyGraph.fetchCell(adr('C6'))
    const d5 = engine.dependencyGraph.fetchCell(adr('D5'))
    const d6 = engine.dependencyGraph.fetchCell(adr('D6'))

    expect(engine.graph.existsEdge(c5, cd)).toBe(true)
    expect(engine.graph.existsEdge(c6, cd)).toBe(true)
    expect(engine.graph.existsEdge(d5, cd)).toBe(true)
    expect(engine.graph.existsEdge(d6, cd)).toBe(true)
  })

  it('should create correct edges for infinite range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(C:E)'],
      ['=SUM(D:G)'],
    ])

    engine.setCellContents(adr('B1'), '=SUM(D42:H42)')

    const ce = engine.rangeMapping.getRange(colStart('C'), colEnd('E'))!
    const dg = engine.rangeMapping.getRange(colStart('D'), colEnd('G'))!

    const d42 = engine.dependencyGraph.fetchCell(adr('D42'))
    const e42 = engine.dependencyGraph.fetchCell(adr('E42'))
    const f42 = engine.dependencyGraph.fetchCell(adr('F42'))
    const g42 = engine.dependencyGraph.fetchCell(adr('G42'))
    const h42 = engine.dependencyGraph.fetchCell(adr('H42'))

    expect(engine.graph.existsEdge(d42, ce)).toBe(true)
    expect(engine.graph.existsEdge(e42, ce)).toBe(true)
    expect(engine.graph.existsEdge(f42, ce)).toBe(false)

    expect(engine.graph.existsEdge(d42, dg)).toBe(true)
    expect(engine.graph.existsEdge(e42, dg)).toBe(true)
    expect(engine.graph.existsEdge(f42, dg)).toBe(true)
    expect(engine.graph.existsEdge(g42, dg)).toBe(true)
    expect(engine.graph.existsEdge(h42, dg)).toBe(false)
  })

  it('should clear column range set in graph when removing column', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(B:B)']
    ])

    engine.removeColumns(0, [1, 1])

    expect(engine.graph.getInfiniteRanges().length).toBe(0)
  })

  it('should not move infinite range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '', '', '=SUM(A:B)']
    ])
    expect(engine.getCellValue(adr('E1'))).toEqual(3)

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1), adr('C1'))

    expect(engine.getCellValue(adr('E1'))).toEqual(0)
    const range = extractColumnRange(engine, adr('E1'))
    expect(range.start).toEqual(colStart('A'))
    expect(range.end).toEqual(colEnd('B'))
  })

  it('no infinite', () => {
    const engine = HyperFormula.buildFromArray([[2, 3], [2, 42]], {useArrayArithmetic: true})
    engine.setCellContents({ sheet: 0, row: 2, col: 2 }, "=A1:A2+A1:B1")

    expect(engine.getSheetValues(0)).toEqual([[2, 3], [2, 42], [null, null, 4, 5], [null, null, 4, 5]])
  })

  it('one infinite', () => {
    const engine = HyperFormula.buildFromArray([[2, 3], [2, 42]], {useArrayArithmetic: true})
    engine.setCellContents({ sheet: 0, row: 2, col: 2 }, "=A:A+A1:B1")

    expect(engine.getSheetValues(0)).toEqual([[2, 3], [2, 42], [null, null, 4, 5], [null, null, 4, 5]])
  })

  it('parsing error', () => {
    const engine = HyperFormula.buildFromArray([[2, 3], [2, 42]], {useArrayArithmetic: true})
    engine.setCellContents({ sheet: 0, row: 2, col: 2 }, "=+++")

    expect(engine.getSheetValues(0)).toEqual([[2, 3], [2, 42], [null, null, 4, 5], [null, null, 4, 5]])
  })

  it('user', () => {
    const engine = HyperFormula.buildFromSheets(
      {
        Sheet1: [["1"]]
      },
      {
        licenseKey: "gpl-v3",
        useArrayArithmetic: true
      }
    )
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "='Sheet1'!A:A+'Sheet1'!1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 0', () => {
    const engine = HyperFormula.buildFromArray([['1']], {useArrayArithmetic: true})
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "='Sheet1'!A:A+'Sheet1'!1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 1', () => {
    const engine = HyperFormula.buildFromArray([['1']], {useArrayArithmetic: true})
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "=A:A+1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 2', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', "='Sheet1'!A:A+'Sheet1'!1:1"],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })

  it('user 3', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A:A+1:1'],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })

  it('user 3 mod', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['=B:B+1:1'],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('A2'))).toEqual('error')
  })

  it('user 4', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A:A+A:A'],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })

  it('user no array arithmetic', () => {
    const engine = HyperFormula.buildFromSheets(
      {
        Sheet1: [["1"]]
      },
      {
        licenseKey: "gpl-v3",
      }
    )
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "='Sheet1'!A:A+'Sheet1'!1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 0 no array arithmetic', () => {
    const engine = HyperFormula.buildFromArray([['1']])
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "='Sheet1'!A:A+'Sheet1'!1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 1 no array arithmetic', () => {
    const engine = HyperFormula.buildFromArray([['1']])
    engine.setCellContents({ sheet: 0, row: 0, col: 0 }, "=A:A+1:1")

    expect(engine.getCellValue(adr('A1'))).toEqual('error')
  })

  it('user 2 no array arithmetic', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', "='Sheet1'!A:A+'Sheet1'!1:1"],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })

  it('user 3 no array arithmetic', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A:A+1:1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })

  it('user 4 no array arithmetic', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A:A+A:A'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual('error')
  })
})
