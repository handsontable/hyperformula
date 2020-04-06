import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {CellContentParser} from './CellContentParser'
import {Exporter} from './CellValue'
import {buildColumnSearchStrategy, ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateTimeHelper} from './DateTimeHelper'
import {CrudOperations} from './CrudOperations'
import {DependencyGraph} from './DependencyGraph'
import {Evaluator} from './Evaluator'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {UIElement} from './i18n'
import {NamedExpressions} from './NamedExpressions'
import {NumberLiteralHelper} from './NumberLiteralHelper'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {Serialization} from './Serialization'
import {EmptyStatistics, Statistics, StatType} from './statistics'
import {UndoRedo} from './UndoRedo'

export type EngineState = {
  config: Config,
  stats: Statistics,
  dependencyGraph: DependencyGraph,
  columnSearch: ColumnSearchStrategy,
  parser: ParserWithCaching,
  unparser: Unparser,
  cellContentParser: CellContentParser,
  evaluator: Evaluator,
  lazilyTransformingAstService: LazilyTransformingAstService,
  undoRedo: UndoRedo,
  crudOperations: CrudOperations,
  exporter: Exporter,
  namedExpressions: NamedExpressions,
  serialization: Serialization,
}

export class BuildEngineFactory {
  private static buildEngine(config: Config, sheets: Sheets = {}, stats: Statistics = config.useStats ? new Statistics() : new EmptyStatistics()): EngineState {
    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const undoRedo: UndoRedo = new UndoRedo()
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnSearch = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping

    for (const sheetName in sheets) {
      if (Object.prototype.hasOwnProperty.call(sheets, sheetName)) {
        const sheetId = sheetMapping.addSheet(sheetName)
        addressMapping.autoAddSheet(sheetId, sheets[sheetName])
      }
    }

    const notEmpty = sheetMapping.numberOfSheets() > 0
    const parser = new ParserWithCaching(config, notEmpty ? sheetMapping.get : sheetMapping.fetch)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateTimeHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const cellContentParser = new CellContentParser(config, dateHelper, numberLiteralHelper)

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnSearch, parser, cellContentParser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.undoRedo = undoRedo
    lazilyTransformingAstService.parser = parser

    const evaluator = new Evaluator(dependencyGraph, columnSearch, config, stats, dateHelper, numberLiteralHelper)
    evaluator.run()

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

  public static buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): EngineState {
    const config = new Config(configInput)
    return this.buildEngine(config, sheets)
  }

  public static buildFromSheet(sheet: Sheet, configInput?: Partial<ConfigParams>): EngineState {
    const config = new Config(configInput)
    const newsheetprefix = config.translationPackage.getUITranslation(UIElement.NEW_SHEET_PREFIX) + '1'
    return this.buildEngine(config, {[newsheetprefix]: sheet})
  }

  public static buildEmpty(configInput?: Partial<ConfigParams>): EngineState {
    return this.buildEngine(new Config(configInput))
  }

  public static rebuildWithConfig(config: Config, sheets: Sheets, stats: Statistics): EngineState {
    return this.buildEngine(config, sheets, stats)
  }
}
