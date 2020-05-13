import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('vertex counting', () => {
  it('one-time formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
    engine.calculateFormula('=SUM(A1:B2)', 'Sheet1')
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
  })

  it('cruds', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
    engine.setCellContents(adr('A1'), '=SUM(A2:B2)')
    engine.dependencyGarbageCollect()
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(5)
    engine.setCellContents(adr('A1'), 1)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(5)
    engine.dependencyGarbageCollect()
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
  })
})

describe('range mapping', () => {
  it('one-time formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
    engine.calculateFormula('=SUM(A1:B2)', 'Sheet1')
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('cruds', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
    engine.setCellContents(adr('A1'), '=SUM(A2:B2)')
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(1)
    engine.setCellContents(adr('A1'), 1)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(1)
    engine.dependencyGarbageCollect()
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})
