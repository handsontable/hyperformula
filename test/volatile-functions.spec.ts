import {HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from "./testUtils";

describe('Interpreter - function RAND', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=RAND()', '42'],
    ])
    const valueBeforeRecomputation = engine.getCellValue('A1')

    engine.setCellContent(adr('B1'), '35')

    expect(engine.getCellValue('A1')).not.toEqual(valueBeforeRecomputation)
  })

  it('formula can be recognized as volatile even if entered later', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A2+A3', '42'],
    ])

    engine.setCellContent(simpleCellAddress(0, 0, 0), '=RAND()')

    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    expect(engine.dependencyGraph!.volatileVertices()).toEqual(new Set([a1]))
  })

  it('volatile vertices should not be recomputed after removing from graph', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=RAND()', '42'],
    ])

    engine.setCellContent(adr('A1'), '35')

    expect(engine.dependencyGraph!.verticesToRecompute()).toEqual(new Set())
  })
})
