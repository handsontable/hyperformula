import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateHelper} from './DateHelper'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder} from './GraphBuilder'
import {HyperFormula} from './HyperFormula'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {StatType} from './statistics/Statistics'
import {collatorFromConfig} from './StringHelper'
import {UndoRedo} from './UndoRedo'

export class RebuildEngineWithConfigFactory {
  public rebuildWithConfig(oldEngine: HyperFormula, newParams: Partial<ConfigParams>): HyperFormula {
    const stats = oldEngine.stats
    const config: Config = oldEngine.config.mergeConfig(newParams)

    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping
    const oldConfigNewLanguage = oldEngine.config.mergeConfig( {language: newParams.language} )
    const actualUnparser = new Unparser(oldConfigNewLanguage, buildLexerConfig(oldConfigNewLanguage), oldEngine.dependencyGraph.sheetMapping.fetchDisplayName)
    const sheets = oldEngine.getAllSheetsSerializedWithUnparser(actualUnparser)
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.get)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const collator = collatorFromConfig(config)
    const cellContentParser = new CellContentParser(config, dateHelper)

    const undoRedo = oldEngine.undoRedo

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnIndex, parser, cellContentParser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser
    lazilyTransformingAstService.undoRedo = undoRedo

    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats, dateHelper, collator)
    evaluator.run()

    stats.end(StatType.BUILD_ENGINE_TOTAL)

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
      undoRedo
    )

    return engine
  }
}
