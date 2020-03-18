import {HyperFormula} from '../src'
import './testConfig.ts'
import {Config} from '../src/Config'

describe('Building engine from arrays', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('#buildFromSheet adds default sheet Sheet1', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.getAllSheetsDimensions()).toEqual({'Sheet1': {'height': 0, 'width': 0}})
  })

  it('#buildFromSheets accepts config', () => {
    const config = { dateFormats: ['MM'] }
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })

  it('#buildFromSheet accepts config', () => {
    const config = { dateFormats: ['MM'] }
    const engine = HyperFormula.buildFromArray([], config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })
})
