import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {adr} from './testUtils'

describe('Interpreter - function RAND', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND()', '42'],
    ])
    const valueBeforeRecomputation = engine.getCellValue(adr('A1'))

    engine.setCellContents(adr('B1'), '35')

    expect(engine.getCellValue(adr('A1'))).not.toEqual(valueBeforeRecomputation)
  })

  it('cell which is dependent on volatile formula is also recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND()', '42', '=A1'],
    ])
    const valueBeforeRecomputation = engine.getCellValue(adr('C1'))

    engine.setCellContents(adr('B1'), '35')

    expect(engine.getCellValue(adr('C1'))).not.toEqual(valueBeforeRecomputation)
  })

  it('formula can be recognized as volatile even if entered later', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2+A3', '42'],
    ])

    engine.setCellContents(simpleCellAddress(0, 0, 0), '=RAND()')

    const a1 = engine.addressMapping.getCell(simpleCellAddress(0, 0, 0))
    expect(engine.dependencyGraph.volatileVertices()).toEqual(new Set([a1]))
  })

  it('volatile vertices should not be recomputed after removing from graph', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND()', '42'],
    ])

    engine.setCellContents(adr('A1'), '35')

    expect(engine.dependencyGraph.verticesToRecompute()).toEqual(new Set())
  })

  it('volatile formula after moving is still volatile', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND()', '42'],
    ])

    engine.moveCells(adr('A1'), 1, 1, adr('A2'))

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(engine.dependencyGraph.volatileVertices()).toEqual(new Set([a2]))
  })
})
