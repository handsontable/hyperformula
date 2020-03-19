import {HyperFormula} from '../src'
import './testConfig.ts'
import {Config} from '../src/Config'
import {plPL} from '../src/i18n'

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

  it('#buildFromSheet adds default sheet Sheet1, in different languages', () => {
    const engine = HyperFormula.buildFromArray([], { language: plPL })

    expect(engine.getAllSheetsDimensions()).toEqual({'Arkusz1': {'height': 0, 'width': 0}})
  })

  xit('#buildFromSheets accepts config', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.config).toBe(config)
  })

  xit('#buildFromSheet accepts config', () => {
    const config = new Config()
    const engine = HyperFormula.buildFromArray([], config)

    expect(engine.config).toBe(config)
  })
})
