import {HyperFormula} from '../src'
import {adr, rowEnd, rowStart} from './testUtils'

describe('Row ranges', () => {
  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(1:2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('should create correct edges for infinite range when building graph', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(3:4)'],
      ['=SUM(C3:D4)'],
    ])

    const rowRange = engine.rangeMapping.getRange(rowStart(3), rowEnd(4))!

    const c3 = engine.dependencyGraph.fetchCell(adr('C3'))
    const c4 = engine.dependencyGraph.fetchCell(adr('C4'))
    const d3 = engine.dependencyGraph.fetchCell(adr('D3'))
    const d4 = engine.dependencyGraph.fetchCell(adr('D4'))

    expect(engine.graph.existsEdge(c3, rowRange)).toBe(true)
    expect(engine.graph.existsEdge(c4, rowRange)).toBe(true)
    expect(engine.graph.existsEdge(d3, rowRange)).toBe(true)
    expect(engine.graph.existsEdge(d4, rowRange)).toBe(true)
  })

  it('should create correct edges for infinite range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(3:5)'],
      ['=SUM(4:7)'],
    ])

    engine.setCellContents(adr('B1'), '=SUM(Z4:Z8)')

    const rowRange35 = engine.rangeMapping.getRange(rowStart(3), rowEnd(5))!
    const rowRange47 = engine.rangeMapping.getRange(rowStart(4), rowEnd(7))!

    const z4 = engine.dependencyGraph.fetchCell(adr('Z4'))
    const z5 = engine.dependencyGraph.fetchCell(adr('Z5'))
    const z6 = engine.dependencyGraph.fetchCell(adr('Z6'))
    const z7 = engine.dependencyGraph.fetchCell(adr('Z7'))
    const z8 = engine.dependencyGraph.fetchCell(adr('Z8'))

    expect(engine.graph.existsEdge(z4, rowRange35)).toBe(true)
    expect(engine.graph.existsEdge(z5, rowRange35)).toBe(true)
    expect(engine.graph.existsEdge(z6, rowRange35)).toBe(false)

    expect(engine.graph.existsEdge(z4, rowRange47)).toBe(true)
    expect(engine.graph.existsEdge(z5, rowRange47)).toBe(true)
    expect(engine.graph.existsEdge(z6, rowRange47)).toBe(true)
    expect(engine.graph.existsEdge(z7, rowRange47)).toBe(true)
    expect(engine.graph.existsEdge(z8, rowRange47)).toBe(false)
  })
})
