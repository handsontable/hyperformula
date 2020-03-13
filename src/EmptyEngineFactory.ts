import {buildConfig, Config, HyperFormula, LazilyTransformingAstService} from './'
import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {DateHelper} from './DateHelper'
import {DependencyGraph} from './DependencyGraph'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics} from './statistics/Statistics'
import {collatorFromConfig} from './StringHelper'
import {UndoRedo} from './UndoRedo'

export class EmptyEngineFactory {
  public build(config: Config = buildConfig()): HyperFormula {
    const undoRedo = new UndoRedo()
    const stats = new Statistics()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const unparser = new Unparser(config, buildLexerConfig(config), dependencyGraph.sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const collator = collatorFromConfig(config)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats, dateHelper, collator)
    const cellContentParser = new CellContentParser(config, dateHelper)

    lazilyTransformingAstService.parser = parser
    lazilyTransformingAstService.undoRedo = undoRedo

    const engine = new HyperFormula(
      config,
      stats,
      dependencyGraph,
      columnIndex,
      parser,
      unparser,
      cellContentParser,
      evaluator,
      lazilyTransformingAstService,
      undoRedo,
    )

    return engine
  }
}
