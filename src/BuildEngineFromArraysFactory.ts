import {Config, HandsOnEngine} from './'
import {Sheet, Sheets} from './GraphBuilder'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    engine.buildFromSheets(sheets)
    return engine
  }

  public buildFromSheet(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    engine.buildFromSheets({Sheet1: sheet})
    return engine
  }
}
