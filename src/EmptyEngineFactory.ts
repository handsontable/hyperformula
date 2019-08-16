import {Config, HandsOnEngine, LazilyTransformingAstService} from './'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()
    const dependencyGraph = DependencyGraph.buildEmpty(config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const lazilyTransformingAstService = new LazilyTransformingAstService(dependencyGraph, parser)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph,
      parser,
      evaluator,
      lazilyTransformingAstService
    )
    return engine
  }
}
