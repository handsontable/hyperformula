import {buildConfig, HyperFormula} from '../src'
import './testConfig.ts'

describe('Building engine from arrays', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('#buildFromSheets accepts config', () => {
    const config = buildConfig()
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.config).toBe(config)
  })

  it('#buildFromSheet accepts config', () => {
    const config = buildConfig()
    const engine = HyperFormula.buildFromArray([], config)

    expect(engine.config).toBe(config)
  })

  it('#buildFromSheet adds default sheet Sheet1', () => {
    const config = buildConfig()
    const engine = HyperFormula.buildFromArray([], config)

    expect(engine.getAllSheetsDimensions()).toEqual({'Sheet1': {'height': 0, 'width': 0}})
  })
})
