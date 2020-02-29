import {HyperFormula, ExportedCellChange} from '../src'
import {ErrorType} from '../src/Cell'
import './testConfig'
import { adr, detailedError } from './testUtils'

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

describe('Events - onSheetRemoved', () => {
  it('works', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jest.fn()

    engine.onSheetRemoved(handler)
    engine.removeSheet("Sheet2")

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])
  })
})
