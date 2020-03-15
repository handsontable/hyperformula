import {HyperFormula} from '../src'
import './testConfig.ts'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })
})
