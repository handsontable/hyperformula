/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ArraySizePredictor} from './ArraySize'
import {CellContentParser} from './CellContentParser'
import {ClipboardOperations} from './ClipboardOperations'
import {Config, ConfigParams} from './Config'
import {CrudOperations} from './CrudOperations'
import {DateTimeHelper} from './DateTimeHelper'
import {DependencyGraph} from './DependencyGraph'
import {SheetSizeLimitExceededError} from './errors'
import {Evaluator} from './Evaluator'
import {Exporter} from './Exporter'
import {GraphBuilder} from './GraphBuilder'
import {UIElement} from './i18n'
import {ArithmeticHelper} from './interpreter/ArithmeticHelper'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {Interpreter} from './interpreter/Interpreter'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {buildColumnSearchStrategy, ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {NamedExpressions} from './NamedExpressions'
import {NumberLiteralHelper} from './NumberLiteralHelper'
import {Operations} from './Operations'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {Serialization, SerializedNamedExpression} from './Serialization'
import {findBoundaries, Sheet, Sheets, validateAsSheet} from './Sheet'
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
  crudOperations: CrudOperations,
  exporter: Exporter,
  namedExpressions: NamedExpressions,
  serialization: Serialization,
  functionRegistry: FunctionRegistry,
}

export class BuildEngineFactory {
  public static buildFromSheets(sheets: Sheets, configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): [EngineState, Promise<void>] {
    const config = new Config(configInput)
    return this.buildEngine(config, sheets, namedExpressions)
  }

  public static buildFromSheet(sheet: Sheet, configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): [EngineState, Promise<void>] {
    const config = new Config(configInput)
    const newsheetprefix = config.translationPackage.getUITranslation(UIElement.NEW_SHEET_PREFIX) + '1'
    return this.buildEngine(config, {[newsheetprefix]: sheet}, namedExpressions)
  }

  public static buildEmpty(configInput: Partial<ConfigParams> = {}, namedExpressions: SerializedNamedExpression[] = []): [EngineState, Promise<void>] {
    return this.buildEngine(new Config(configInput), {}, namedExpressions)
  }

  public static rebuildWithConfig(config: Config, sheets: Sheets, namedExpressions: SerializedNamedExpression[], stats: Statistics): [EngineState, Promise<void>] {
    return this.buildEngine(config, sheets, namedExpressions, stats)
  }

  private static buildEngine(config: Config, sheets: Sheets = {}, inputNamedExpressions: SerializedNamedExpression[] = [], stats: Statistics = config.useStats ? new Statistics() : new EmptyStatistics()): [EngineState, Promise<void>] {
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
    lazilyTransformingAstService.parser = parser
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName, namedExpressions)
    const dateTimeHelper = new DateTimeHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const arithmeticHelper = new ArithmeticHelper(config, dateTimeHelper, numberLiteralHelper)
    const cellContentParser = new CellContentParser(config, dateTimeHelper, numberLiteralHelper)

    const arraySizePredictor = new ArraySizePredictor(config, functionRegistry)
    const operations = new Operations(config, dependencyGraph, columnSearch, cellContentParser, parser, stats, lazilyTransformingAstService, namedExpressions, arraySizePredictor)
    const undoRedo = new UndoRedo(config, operations)
    lazilyTransformingAstService.undoRedo = undoRedo
    const clipboardOperations = new ClipboardOperations(config, dependencyGraph, operations)
    const crudOperations = new CrudOperations(config, operations, undoRedo, clipboardOperations, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService, namedExpressions)
    inputNamedExpressions.forEach((entry: SerializedNamedExpression) => {
      crudOperations.ensureItIsPossibleToAddNamedExpression(entry.name, entry.expression, entry.scope)
      crudOperations.operations.addNamedExpression(entry.name, entry.expression, entry.scope, entry.options)
    })

    const exporter = new Exporter(config, namedExpressions, sheetMapping.fetchDisplayName, lazilyTransformingAstService)
    const serialization = new Serialization(dependencyGraph, unparser, exporter)

    const interpreter = new Interpreter(config, dependencyGraph, columnSearch, stats, arithmeticHelper, functionRegistry, namedExpressions, serialization, arraySizePredictor, dateTimeHelper, cellContentParser)

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnSearch, parser, cellContentParser, stats, arraySizePredictor)
      graphBuilder.buildGraph(sheets, stats)
    })

    const evaluator = new Evaluator(config, stats, interpreter, lazilyTransformingAstService, dependencyGraph, columnSearch, operations)

    const evaluatorPromise = evaluator.run()

    stats.end(StatType.BUILD_ENGINE_TOTAL)

    return [{
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
    }, evaluatorPromise]
  }
}
