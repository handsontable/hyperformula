import {HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'

describe('Interpreter - function RAND', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=RAND()', '42'],
    ])
    const valueBeforeRecomputation = engine.getCellValue('A1')

    engine.setCellContent(simpleCellAddress(0, 1, 0), '35')

    expect(engine.getCellValue('A1')).not.toEqual(valueBeforeRecomputation)
  })

  it('volatile vertices should not be recomputed after removing from graph', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=RAND()', '42'],
    ])
    // const valueBeforeRecomputation = engine.getCellValue('A1')

    engine.setCellContent(simpleCellAddress(0, 0, 0), '35')
    // engine.setCellContent(simpleCellAddress(0, 1, 0), '35')

    expect(engine.dependencyGraph!.verticesToRecompute()).toEqual(new Set())
    // expect(engine.getCellValue('A1')).not.toEqual(valueBeforeRecomputation)
  })
})
