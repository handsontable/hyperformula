import {Config, HandsOnEngine, LazilyTransformingAstService} from './'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {ParserWithCaching} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
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

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnIndex, parser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser

    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnIndex, config, stats)
    evaluator.run()

    stats.end(StatType.BUILD_ENGINE_TOTAL)

    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph,
      columnIndex,
      parser,
      evaluator,
      lazilyTransformingAstService,
    )

    return engine
  }

  public buildFromSheet(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    return this.buildFromSheets({Sheet1: sheet}, config)
  }
}
