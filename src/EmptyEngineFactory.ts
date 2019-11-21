import {Config, HyperFormula, LazilyTransformingAstService} from './'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {DependencyGraph} from './DependencyGraph'
import {ParserWithCaching, Unparser, buildLexerConfig} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics} from './statistics/Statistics'

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HyperFormula {
    const stats = new Statistics()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const unparser = new Unparser(config, buildLexerConfig(config), dependencyGraph.sheetMapping.name)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats)
    lazilyTransformingAstService.parser = parser
    const engine = new HyperFormula(
      config,
      stats,
      dependencyGraph,
      columnIndex,
      parser,
      unparser,
      evaluator,
      lazilyTransformingAstService,
    )
    return engine
  }
}
