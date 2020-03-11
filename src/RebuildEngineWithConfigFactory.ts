import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateHelper} from './DateHelper'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder, Sheets} from './GraphBuilder'
import {HyperFormula} from './HyperFormula'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {StatType} from './statistics/Statistics'

export class RebuildEngineWithConfigFactory {
  public rebuildWithConfig(oldEngine: HyperFormula, newParams: Partial<ConfigParams>): HyperFormula {
    const stats = oldEngine.stats
    const config: Config = oldEngine.config.mergeConfig(newParams)

    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const lazilyTransformingAstService = oldEngine.lazilyTransformingAstService
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping
    const oldConfigNewLanguage = oldEngine.config.mergeConfig( {language: newParams.language} )
    const actualUnparser = new Unparser(oldConfigNewLanguage, buildLexerConfig(oldConfigNewLanguage), oldEngine.dependencyGraph.sheetMapping.fetchDisplayName)
    const sheets = oldEngine.getAllSheetsSerialized(actualUnparser)
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.get)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const cellContentParser = new CellContentParser(config, dateHelper)

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnIndex, parser, cellContentParser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser

    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats, dateHelper)
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
    )

    return engine
  }
}
