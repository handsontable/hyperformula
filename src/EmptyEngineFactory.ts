import {Config, HandsOnEngine, LazilyTransformingAstService} from './'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'
import {ColumnIndex} from "./ColumnSearch/ColumnIndex";
import {buildColumnSearchStrategy} from "./ColumnSearch/ColumnSearchStrategy";

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
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
