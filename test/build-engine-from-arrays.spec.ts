import {Config, HandsOnEngine} from '../src'
import './testConfig.ts'

describe('Building engine from arrays', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    expect(engine).toBeInstanceOf(HandsOnEngine)
  })

  it('#buildFromSheets accepts config', () => {
    const config = new Config()
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.config).toBe(config)
  })

  it('#buildFromSheet accepts config', () => {
    const config = new Config()
    const engine = HandsOnEngine.buildFromArray([], config)

    expect(engine.config).toBe(config)
  })

  it('#buildFromSheet adds default sheet Sheet1', () => {
    const config = new Config()
    const engine = HandsOnEngine.buildFromArray([], config)

    expect(Array.from(engine.getSheetsDimensions().keys())).toEqual(["Sheet1"])
  })
})
