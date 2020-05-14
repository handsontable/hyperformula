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
    for(let tmp = 0; tmp < 25; tmp++) {
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          const col1 = randomInteger(2, 7)
          const row1 = randomInteger(2, 7)
          const col2 = col1 + randomInteger(-2, 2)
          const row2 = row1 + randomInteger(-2, 2)
          const startAddress = engine.simpleCellAddressToString({
            sheet: 0,
            row: Math.min(row1, row2),
            col: Math.min(col1, col2)
          }, 0)
          const endAddress = engine.simpleCellAddressToString({
            sheet: 0,
            row: Math.max(row1, row2),
            col: Math.max(col1, col2)
          }, 0)
          const formula = '=SUM(' + startAddress + ':' + endAddress + ')'
          engine.setCellContents({sheet: 0, col: x, row: y}, formula)
        }
      }
    }
    for(let x=0; x<10; x++) {
      for(let y=0; y<10; y++) {
        engine.setCellContents({sheet: 0, col: x, row: y}, null)
      }
    }
    console.log(engine.dependencyGraph.graph.nodesCount(), engine.dependencyGraph.rangeMapping.getMappingSize(0))
    engine.dependencyGarbageCollect()
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})
