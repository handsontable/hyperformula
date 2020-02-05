import {Config, HyperFormula, LazilyTransformingAstService} from './'
import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {DateHelper} from './Date'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HyperFormula {
    const stats = new Statistics()

    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping
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

  public buildFromSheet(sheet: Sheet, config: Config = new Config()): HyperFormula {
    return this.buildFromSheets({Sheet1: sheet}, config)
  }
}
