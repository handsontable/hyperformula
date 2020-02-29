import {HyperFormula} from '../src'
import './testConfig'

describe('Events - onSheetAdded', () => {
  it('works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jest.fn()
    
    engine.onSheetAdded(handler)
    engine.addSheet("FooBar")

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith("FooBar")
  })
})
