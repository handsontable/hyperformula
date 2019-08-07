import {Config, HandsOnEngine} from './'
import {Sheet, Sheets, GraphBuilder} from './GraphBuilder'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()

    stats.start(StatType.OVERALL)

    const dependencyGraph = DependencyGraph.buildEmpty(config, stats)
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

    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    evaluator.run()

    stats.end(StatType.OVERALL)

    const engine = new HandsOnEngine(
      config,
      stats,
      dependencyGraph,
      parser,
      evaluator
    )
    return engine
  }

  public buildFromSheet(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    return this.buildFromSheets({Sheet1: sheet}, config)
  }
}
