import {LazilyTransformingAstService} from './'
import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy, ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateHelper} from './DateHelper'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'
import {collatorFromConfig} from './StringHelper'
import {UndoRedo} from './UndoRedo'
import {CrudOperations} from './CrudOperations'
import {NamedExpressions} from './NamedExpressions'
import {Exporter} from './CellValue'
import {Serialization} from './Serialization'

export type Engine = {
  config: Config,
  stats: Statistics,
  dependencyGraph: DependencyGraph,
  columnSearch: ColumnSearchStrategy,
  parser: ParserWithCaching,
  unparser: Unparser,
  cellContentParser: CellContentParser,
  evaluator: SingleThreadEvaluator,
  lazilyTransformingAstService: LazilyTransformingAstService,
  undoRedo: UndoRedo,
  crudOperations: CrudOperations,
  exporter: Exporter,
  namedExpressions: NamedExpressions,
  serialization: Serialization,
}

export class BuildEngineFactory {
  private static buildEngine(config: Config, sheets?: Sheets, stats: Statistics = new Statistics(), undoRedo: UndoRedo = new UndoRedo()): Engine {
    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnSearch = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping

    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const notEmpty = sheetMapping.numberOfSheets() > 0
    const parser = new ParserWithCaching(config, notEmpty ? sheetMapping.get : sheetMapping.fetch)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const collator = collatorFromConfig(config)
    const cellContentParser = new CellContentParser(config, dateHelper)

    if (sheets !== undefined) {
      stats.measure(StatType.GRAPH_BUILD, () => {
        const graphBuilder = new GraphBuilder(dependencyGraph, columnSearch, parser, cellContentParser, config, stats)
        graphBuilder.buildGraph(sheets)
      })
    }

    lazilyTransformingAstService.undoRedo = undoRedo
    lazilyTransformingAstService.parser = parser

    const evaluator = new SingleThreadEvaluator(dependencyGraph, columnSearch, config, stats, dateHelper, collator)

    if (notEmpty) {
      evaluator.run()
    }

    const crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService, undoRedo)
    undoRedo.crudOperations = crudOperations
    const namedExpressions = new NamedExpressions(cellContentParser, dependencyGraph, parser, crudOperations)
    const exporter = new Exporter(config, namedExpressions)
    const serialization = new Serialization(dependencyGraph, unparser, config, exporter)

    stats.end(StatType.BUILD_ENGINE_TOTAL)

    return {
      config,
      stats,
      dependencyGraph,
      columnSearch,
      parser,
      unparser,
      cellContentParser,
      evaluator,
      lazilyTransformingAstService,
      undoRedo,
      crudOperations,
      exporter,
      namedExpressions,
      serialization
    }
  }

  public static buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): Engine {
    return this.buildEngine(new Config(configInput), sheets)
  }

  public static buildFromSheet(sheet: Sheet, configInput?: Partial<ConfigParams>): Engine {
    return this.buildEngine(new Config(configInput), {Sheet1: sheet})
  }

  public static buildEmpty(configInput?: Partial<ConfigParams>): Engine {
    return this.buildEngine(new Config(configInput))
  }

  public static rebuildWithConfig(config: Config, sheets: Sheets, stats: Statistics, undoRedo: UndoRedo): Engine {
    return this.buildEngine(config, sheets, stats, undoRedo)
  }
}
