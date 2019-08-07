import {Config, HandsOnEngine} from './'
import {Statistics, StatType} from './statistics/Statistics'
import {
  AddressMapping,
  DependencyGraph,
  Graph,
  RangeMapping,
  SheetMapping,
  MatrixMapping,
  Vertex,
} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()
    const dependencyGraph = DependencyGraph.buildEmpty(config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph.sheetMapping,
      dependencyGraph.addressMapping,
      dependencyGraph,
      parser,
      evaluator
    )
    return engine
  }
}
