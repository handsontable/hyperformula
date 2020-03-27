import {HyperFormula} from '../src'
import {adr} from './testUtils'
import {simpleCellAddress} from '../src/Cell'

describe('Column ranges', () => {
  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })

  it('should create correct edges for infinite range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(C:E)'],
      ['=SUM(D:G)'],
    ])

    engine.setCellContents(adr('B1'), '=SUM(D42:H42)')

    const ce = engine.rangeMapping.getRange(simpleCellAddress(0, 2, 0), simpleCellAddress(0, 4, Number.POSITIVE_INFINITY))!
    const dg = engine.rangeMapping.getRange(simpleCellAddress(0, 3, 0), simpleCellAddress(0, 6, Number.POSITIVE_INFINITY))!

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
})
