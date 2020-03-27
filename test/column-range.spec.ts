import {HyperFormula} from '../src'
import {adr, extractColumnRange, extractRange} from './testUtils'
import {simpleCellAddress} from '../src/Cell'

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


    const cd = engine.rangeMapping.getRange(simpleCellAddress(0, 2, Number.NEGATIVE_INFINITY), simpleCellAddress(0, 3, Number.POSITIVE_INFINITY))!

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

    const ce = engine.rangeMapping.getRange(simpleCellAddress(0, 2, Number.NEGATIVE_INFINITY), simpleCellAddress(0, 4, Number.POSITIVE_INFINITY))!
    const dg = engine.rangeMapping.getRange(simpleCellAddress(0, 3, Number.NEGATIVE_INFINITY), simpleCellAddress(0, 6, Number.POSITIVE_INFINITY))!

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

    expect(engine.graph.columnRanges.size).toBe(0)
  })

  it('should transform relative column references', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(C:D)']
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('B2'))

    const range = extractColumnRange(engine, adr('B2'))
    expect(range.start).toEqual(simpleCellAddress(0, 2, Number.NEGATIVE_INFINITY))
    expect(range.end).toEqual(simpleCellAddress(0, 3, Number.POSITIVE_INFINITY))
  })
})
