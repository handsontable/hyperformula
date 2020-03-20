import {HyperFormula, LazilyTransformingAstService} from './'
import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateHelper} from './DateHelper'
import {NumberLiteralHelper} from './NumberLiteralHelper'
import {DependencyGraph} from './DependencyGraph'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {Evaluator} from './Evaluator'
import {Statistics} from './statistics/Statistics'
import {collatorFromConfig} from './StringHelper'
import {UndoRedo} from './UndoRedo'

export class EmptyEngineFactory {
  public build(configInput?: Partial<ConfigParams>): HyperFormula {
    const config = new Config(configInput)
    const undoRedo = new UndoRedo()
    const stats = new Statistics()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const parser = new ParserWithCaching(config, dependencyGraph.sheetMapping.fetch)
    const unparser = new Unparser(config, buildLexerConfig(config), dependencyGraph.sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const collator = collatorFromConfig(config)
    const evaluator = new Evaluator(dependencyGraph, columnIndex, config, stats, dateHelper, numberLiteralHelper, collator)
    const cellContentParser = new CellContentParser(config, dateHelper, numberLiteralHelper)

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
