import {HyperFormula} from '../src'
import './testConfig.ts'
import {plPL} from '../src/i18n';

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('accepts config params', () => {
    const config = { dateFormats: ['MM'] }
    const engine = HyperFormula.buildEmpty(config)
    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })
})

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
