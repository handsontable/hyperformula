import {Config, HandsOnEngine, LazilyTransformingAstService} from './'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'
import {ColumnIndex} from "./ColumnIndex";

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const columnIndex = new ColumnIndex(stats, lazilyTransformingAstService)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats)
    lazilyTransformingAstService.parser = parser
    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph,
      columnIndex,
      parser,
      evaluator,
      lazilyTransformingAstService
    )
    return engine
  }
}
