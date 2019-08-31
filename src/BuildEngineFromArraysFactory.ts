import {Config, HandsOnEngine, LazilyTransformingAstService} from './'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()

    stats.start(StatType.OVERALL)

    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.fetch)

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, parser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser

    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    evaluator.run()

    stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      dependencyGraph.buildColumnIndex()
    })

    stats.end(StatType.OVERALL)

    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph,
      parser,
      evaluator,
      lazilyTransformingAstService
    )

    return engine
  }

  public buildFromSheet(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    return this.buildFromSheets({Sheet1: sheet}, config)
  }
}
