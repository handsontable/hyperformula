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
import {NumberLiteralHelper} from './NumberLiteralHelper'

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

    const language = newParams.language ? newParams.language : config.language
    const configNewLanguage = oldEngine.config.mergeConfig( {language} )
    const sheets = oldEngine.serialization.withNewConfig(configNewLanguage).getAllSheetsSerialized()
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.get)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const numberLiteralsHelper = new NumberLiteralHelper(config)
    const collator = collatorFromConfig(config)
    const cellContentParser = new CellContentParser(config, dateHelper, numberLiteralsHelper)

    const undoRedo = oldEngine.undoRedo

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnIndex, parser, cellContentParser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser
    lazilyTransformingAstService.undoRedo = undoRedo

    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats, dateHelper, numberLiteralsHelper, collator)
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
