import {Config, HandsOnEngine} from './'
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

export class EmptyEngineFactory {
  public build(config: Config = new Config()): HandsOnEngine {
    const stats = new Statistics()
    const sheetMapping = new SheetMapping()
    const addressMapping = AddressMapping.build(config.addressMappingFillThreshold)
    const parser = new ParserWithCaching(config, sheetMapping.fetch)
    const graph = new Graph<Vertex>()
    const rangeMapping = new RangeMapping()
    const matrixMapping = new MatrixMapping()
    const dependencyGraph = new DependencyGraph(addressMapping, rangeMapping, graph, sheetMapping, matrixMapping, stats)
    const evaluator = new SingleThreadEvaluator(dependencyGraph, config, stats)
    const engine = new HandsOnEngine(
      config,
      stats,
      sheetMapping,
      addressMapping,
      graph,
      rangeMapping,
      matrixMapping,
      dependencyGraph,
      parser,
      evaluator
    )
    return engine
  }
}
