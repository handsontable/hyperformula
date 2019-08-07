import {Config, HandsOnEngine} from './'

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    return engine
  }
}
