import {HyperFormula} from "../../src";
import '../testConfig'

describe('batch cruds', () => {
  it('should run batch cruds and call recompute only once', () => {
    const engine = HyperFormula.buildFromArray([])

    const recomputeSpy = jest.spyOn(engine as any, 'recomputeIfDependencyGraphNeedsIt')

    engine.batch((e) => {
      e.addRows(0, [0, 1], [0, 1])
      e.removeRows(0, [0, 1], [0, 1])
    })

    expect(recomputeSpy).toBeCalledTimes(1)
  })
})
