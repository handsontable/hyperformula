import {Config, HandsOnEngine} from './'
import {Sheet, Sheets, GraphBuilder} from './GraphBuilder'
import {Statistics, StatType} from './statistics/Statistics'
import {
  AddressMapping,
  DependencyGraph,
  Graph,
  RangeMapping,
  SheetMapping,
  MatrixMapping,
  Vertex,
} from './DependencyGraph'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParserWithCaching} from './parser'

export class BuildEngineFromArraysFactory {
  public buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()

    stats.start(StatType.OVERALL)

    const sheetMapping = new SheetMapping()
    const addressMapping = AddressMapping.build(config.addressMappingFillThreshold)
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.fetch)

    const graph = new Graph<Vertex>()
    const rangeMapping = new RangeMapping()
    const matrixMapping = new MatrixMapping()
    const dependencyGraph = new DependencyGraph(addressMapping, rangeMapping, graph, sheetMapping, matrixMapping, stats)
    const graphBuilder = new GraphBuilder(dependencyGraph, parser, config, stats)

    stats.measure(StatType.GRAPH_BUILD, () => {
      graphBuilder.buildGraph(sheets)
    })

    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    evaluator.run()

    stats.end(StatType.OVERALL)

    const engine = new HandsOnEngine(
      config,
      stats,
      sheetMapping,
      addressMapping,
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
