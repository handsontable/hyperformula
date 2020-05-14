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

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('larger tests', () => {
  it('repeat the same crud', () => {
    const engine = HyperFormula.buildFromArray([])
    const config = engine.getConfig()
    const maxCols = config.maxColumns
    const maxRows = config.maxRows
    console.log(engine.dependencyGraph.graph.nodesCount(), engine.dependencyGraph.rangeMapping.getMappingSize(0))
    for (let i = 0; i < 1000; i++) {
      const col1 = randomInteger(0, 20)//maxCols)
      const row1 = randomInteger(0, 20)//maxRows)
      const col2 = randomInteger(0, 20)//maxCols)
      const row2 = randomInteger(0, 20)//maxRows)
      const startAddress = engine.simpleCellAddressToString({sheet: 0, row: Math.min(row1,row2), col: Math.min(col1,col2)}, 0)
      const endAddress = engine.simpleCellAddressToString({sheet: 0, row: Math.max(row1,row2), col: Math.max(col1,col2) + 1}, 0)
      const formula = '=SUM(' + startAddress + ':' + endAddress + ')'
      // console.log('set formula:', 'engine.setCellContents({ sheet: 0, col: 0, row: 0 }, "' + formula + '")', i / 30000 * 100, '%')
      const cellAddress = {sheet: 0, col: 0, row: 0}
      engine.setCellContents(cellAddress, formula)
      // console.log('get formula', engine.getCellSerialized(cellAddress));
    }
    console.log('end')
    console.log(engine.dependencyGraph.graph.nodesCount(), engine.dependencyGraph.rangeMapping.getMappingSize(0))
    engine.dependencyGarbageCollect()
    console.log(engine.dependencyGraph.graph.nodesCount(), engine.dependencyGraph.rangeMapping.getMappingSize(0))
  })
})
