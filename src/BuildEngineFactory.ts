/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellContentParser} from './CellContentParser'
import {Config, ConfigParams} from './Config'
import {CrudOperations} from './CrudOperations'
import {DateTimeHelper} from './DateTimeHelper'
import {DependencyGraph} from './DependencyGraph'
import {SheetSizeLimitExceededError} from './errors'
import {Evaluator} from './Evaluator'
import {Exporter} from './Exporter'
import {GraphBuilder} from './GraphBuilder'
import {UIElement} from './i18n'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {buildColumnSearchStrategy, ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {MatrixSizePredictor} from './MatrixSize'
import {NamedExpressions} from './NamedExpressions'
import {NumberLiteralHelper} from './NumberLiteralHelper'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {Serialization, SerializedNamedExpression} from './Serialization'
import {findBoundaries, Sheet, Sheets, validateAsSheet} from './Sheet'
import {EmptyStatistics, Statistics, StatType} from './statistics'

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
  crudOperations: CrudOperations,
  exporter: Exporter,
  namedExpressions: NamedExpressions,
  serialization: Serialization,
  functionRegistry: FunctionRegistry,
}

export class BuildEngineFactory {
  private static buildEngine(config: Config, sheets: Sheets = {}, inputNamedExpressions: SerializedNamedExpression[] = [], stats: Statistics = config.useStats ? new Statistics() : new EmptyStatistics()): EngineState {
    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const namedExpressions = new NamedExpressions()
    const functionRegistry = new FunctionRegistry(config)
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, functionRegistry, namedExpressions, stats)
    const columnSearch = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping

    for (const sheetName in sheets) {
      if (Object.prototype.hasOwnProperty.call(sheets, sheetName)) {
        const sheet = sheets[sheetName]
        validateAsSheet(sheet)
        const boundaries = findBoundaries(sheet)
        if (boundaries.height > config.maxRows || boundaries.width > config.maxColumns) {
          throw new SheetSizeLimitExceededError()
        }
        const sheetId = sheetMapping.addSheet(sheetName)
        addressMapping.autoAddSheet(sheetId, sheet, boundaries)
      }
    }

    const parser = new ParserWithCaching(config, functionRegistry, sheetMapping.get)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName, namedExpressions)
    const dateHelper = new DateTimeHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const cellContentParser = new CellContentParser(config, dateHelper, numberLiteralHelper)

    const matrixSizePredictor = new MatrixSizePredictor(config, functionRegistry)
    const crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService, namedExpressions, matrixSizePredictor)
    inputNamedExpressions.forEach((entry: SerializedNamedExpression) => {
      crudOperations.operations.addNamedExpression(entry.name, entry.expression, entry.scope, entry.options)
    })
    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnSearch, parser, cellContentParser, config, stats, matrixSizePredictor)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.undoRedo = crudOperations.undoRedo
    lazilyTransformingAstService.parser = parser

    const exporter = new Exporter(config, namedExpressions, sheetMapping.fetchDisplayName)
    const serialization = new Serialization(dependencyGraph, unparser, config, exporter)

    const evaluator = new Evaluator(dependencyGraph, columnSearch, config, stats, dateHelper, numberLiteralHelper, functionRegistry, namedExpressions, serialization)
    evaluator.run()

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
      crudOperations,
      exporter,
      namedExpressions,
      serialization,
      functionRegistry,
    }
  }

  public static buildFromSheets(sheets: Sheets, configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): EngineState {
    const config = new Config(configInput)
    return this.buildEngine(config, sheets, namedExpressions)
  }

  public static buildFromSheet(sheet: Sheet, configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): EngineState {
    const config = new Config(configInput)
    const newsheetprefix = config.translationPackage.getUITranslation(UIElement.NEW_SHEET_PREFIX) + '1'
    return this.buildEngine(config, {[newsheetprefix]: sheet}, namedExpressions)
  }

  public static buildEmpty(configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): EngineState {
    return this.buildEngine(new Config(configInput), {}, namedExpressions)
  }

  public static rebuildWithConfig(config: Config, sheets: Sheets, namedExpressions: SerializedNamedExpression[], stats: Statistics): EngineState {
    return this.buildEngine(config, sheets, namedExpressions, stats)
  }
}
