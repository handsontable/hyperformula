/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellType, CellValueType, getCellType, getCellValueType, NoErrorCellValue, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {CellValue, ExportedChange, Exporter} from './CellValue'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {CrudOperations} from './CrudOperations'
import {buildTranslationPackage, RawTranslationPackage, TranslationPackage} from './i18n'
import {normalizeAddedIndexes, normalizeRemovedIndexes} from './Operations'
import {
  AddressMapping,
  DependencyGraph,
  Graph,
  MatrixMapping,
  RangeMapping,
  SheetMapping,
  Vertex,
} from './DependencyGraph'
import {
  EvaluationSuspendedError,
  NamedExpressionDoesNotExist,
  NamedExpressionNameIsAlreadyTaken,
  NamedExpressionNameIsInvalid,
  NotAFormulaError
} from './errors'
import {Evaluator} from './Evaluator'
import {IBatchExecutor} from './IBatchExecutor'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Maybe} from './Maybe'
import {NamedExpressions} from './NamedExpressions'
import {
  Ast,
  AstNodeType,
  ParserWithCaching,
  simpleCellAddressFromString,
  simpleCellAddressToString,
  Unparser,
} from './parser'
import {Serialization} from './Serialization'
import {Statistics, StatType} from './statistics'
import {Emitter, Events, Listeners, TypedEmitter} from './Emitter'
import {BuildEngineFactory, EngineState} from './BuildEngineFactory'
import {Sheet, Sheets} from './Sheet'
import {SheetDimensions} from './_types'
import {FunctionPluginDefinition} from './interpreter/plugin/FunctionPlugin'
import {FunctionRegistry, FunctionTranslationsPackage} from './interpreter/FunctionRegistry'

export type Index = [number, number]

/**
 * This is a class for creating HyperFormula instance, all the following public methods
 * ale related to this class.
 *
 * The instance can be created only by calling one of the static methods
 * `buildFromArray`, `buildFromSheets` or `buildEmpty` and should be disposed of with
 * `destroy` method when it's no longer needed to free the resources.
 *
 * The instance can be seen as a workbook where worksheets can be created and
 * manipulated. They are organized within a widely know structure of columns and rows
 * which can be manipulated as well. The smallest possible data unit are the cells, which
 * may contain simple values or formulas to be calculated.
 *
 * All CRUD methods are called directly on HyperFormula instance and will trigger
 * corresponding lifecycle events. The events are marked accordingly, as well as thrown
 * errors so they can be correctly handled.
 */
export class HyperFormula implements TypedEmitter {

  /**
   * Version of the HyperFormula.
   */
  public static version = process.env.HT_VERSION

  /**
   * Latest build date.
   */
  public static buildDate = process.env.HT_BUILD_DATE

  /**
   * Calls the `graph` method on the dependency graph.
   * Allows to execute `graph` directly without a need to refer to `dependencyGraph`.
   *
   * @internal
   */
  public get graph(): Graph<Vertex> {
    return this.dependencyGraph.graph
  }

  /**
   * Calls the `rangeMapping` method on the dependency graph.
   * Allows to execute `rangeMapping` directly without a need to refer to `dependencyGraph`.
   *
   * @internal
   */
  public get rangeMapping(): RangeMapping {
    return this.dependencyGraph.rangeMapping
  }

  /**
   * Calls the `matrixMapping` method on the dependency graph.
   * Allows to execute `matrixMapping` directly without a need to refer to `dependencyGraph`.
   *
   * @internal
   */
  public get matrixMapping(): MatrixMapping {
    return this.dependencyGraph.matrixMapping
  }

  /**
   * Calls the `sheetMapping` method on the dependency graph.
   * Allows to execute `sheetMapping` directly without a need to refer to `dependencyGraph`.
   *
   * @internal
   */
  public get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }

  /**
   * Calls the `addressMapping` method on the dependency graph.
   * Allows to execute `addressMapping` directly without a need to refer to `dependencyGraph`.
   *
   * @internal
   */
  public get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  /** @internal */
  public get dependencyGraph(): DependencyGraph {
    return this._dependencyGraph
  }

  /** @internal */
  public get evaluator(): Evaluator {
    return this._evaluator
  }

  /** @internal */
  public get columnSearch(): ColumnSearchStrategy {
    return this._columnSearch
  }

  /** @internal */
  public get lazilyTransformingAstService(): LazilyTransformingAstService {
    return this._lazilyTransformingAstService
  }

  private static buildFromEngineState(engine: EngineState): HyperFormula {
    return new HyperFormula(
      engine.config,
      engine.stats,
      engine.dependencyGraph,
      engine.columnSearch,
      engine.parser,
      engine.unparser,
      engine.cellContentParser,
      engine.evaluator,
      engine.lazilyTransformingAstService,
      engine.crudOperations,
      engine.exporter,
      engine.namedExpressions,
      engine.serialization,
      engine.functionRegistry,
    )
  }

  /**
   * Builds the engine for a sheet from a two-dimensional array representation.
   * The engine is created with a single sheet.
   * Can be configured with the optional second parameter that represents a [[ConfigParams]].
   * If not specified, the engine will be built with the default configuration.
   *
   * @param {Sheet} sheet - two-dimensional array representation of sheet
   * @param {Partial<ConfigParams>} [configInput] - engine configuration
   *
   * @throws [[SheetSizeLimitExceededError]] when sheet size exceeds the limits
   * @throws [[FunctionPluginValidationError]] when plugin class definition is not consistent with metadata
   *
   * @category Factory
   */
  public static buildFromArray(sheet: Sheet, configInput?: Partial<ConfigParams>): HyperFormula {
    return this.buildFromEngineState(BuildEngineFactory.buildFromSheet(sheet, configInput))
  }

  /**
   * Builds the engine from an object containing multiple sheets with names.
   * The engine is created with one or more sheets.
   * Can be configured with the optional second parameter that represents a [[ConfigParams]].
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Sheet} sheets - object with sheets definition
   * @param {Partial<ConfigParams>} [configInput] - engine configuration
   *
   * @throws [[SheetSizeLimitExceededError]] when sheet size exceeds the limits
   * @throws [[FunctionPluginValidationError]] when plugin class definition is not consistent with metadata
   *
   * @category Factory
   */
  public static buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): HyperFormula {
    return this.buildFromEngineState(BuildEngineFactory.buildFromSheets(sheets, configInput))
  }

  private static registeredLanguages: Map<string, TranslationPackage> = new Map()

  /**
   * Returns registered language from its code string.
   *
   * @param {string} code - code string of the translation package, for example: 'enGB'
   */
  public static getLanguage(code: string): TranslationPackage {
    const val = this.registeredLanguages.get(code)
    if(val === undefined) {
      throw new Error('Language not registered.')
    } else {
      return val
    }
  }

  /**
   * Registers language from under given code string.
   *
   * @param {string} code - code string of the translation package, for example: 'enGB'
   * @param {RawTranslationPackage} lang - translation package to be registered
   */
  public static registerLanguage(code: string, lang: RawTranslationPackage): void {
    if(this.registeredLanguages.has(code)) {
      throw new Error('Language already registered.')
    } else {
      this.registeredLanguages.set(code, buildTranslationPackage(lang))
    }
  }

  /**
   * Unregisters language that is registered under given code string.
   *
   * @param {string} code - code string of the translation package, for example: 'enGB'
   */
  public static unregisterLanguage(code: string): void {
    if(this.registeredLanguages.has(code)) {
      this.registeredLanguages.delete(code)
    } else {
      throw new Error('Language not registered.')
    }
  }

  /**
   * Returns all registered languages codes.
   */
  public static getRegisteredLanguagesCodes(): string[] {
    return Array.from(this.registeredLanguages.keys())
  }

  /**
   * Registers all functions in a given plugin with optional translations
   *
   * @param {FunctionPluginDefinition} plugin - plugin class
   * @param {FunctionTranslationsPackage} translations - optional package of function names translations
   *
   * @throws [[FunctionPluginValidationError]] when plugin class definition is not consistent with metadata
   */
  public static registerFunctionPlugin(plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    FunctionRegistry.registerFunctionPlugin(plugin, translations)
  }

  /**
   * Unregisters all functions defined in given plugin
   *
   * @param {FunctionPluginDefinition} plugin - plugin class
   */
  public static unregisterFunctionPlugin(plugin: FunctionPluginDefinition): void {
    FunctionRegistry.unregisterFunctionPlugin(plugin)
  }

  /**
   * Registers a function with a given id if such exists in a plugin
   *
   * @param {string} functionId - function id, e.g. 'SUMIF'
   * @param {FunctionPluginDefinition} plugin - plugin class
   * @param translations
   *
   * @throws [[FunctionPluginValidationError]] when function with a given id does not exists in plugin or plugin class definition is not consistent with metadata
   */
  public static registerFunction(functionId: string, plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    FunctionRegistry.registerFunction(functionId, plugin, translations)
  }

  /**
   * Unregisters a function with a given id
   *
   * @param {string} functionId - function id, e.g. 'SUMIF'
   */
  public static unregisterFunction(functionId: string): void {
    FunctionRegistry.unregisterFunction(functionId)
  }

  /**
   * Returns translated names of all registered functions for a given language
   *
   * @param {string} code - language code
   */
  public static getRegisteredFunctionNames(code: string): string[] {
    const functionIds = FunctionRegistry.getRegisteredFunctionIds()
    const language = this.getLanguage(code)
    return language.getFunctionTranslations(functionIds)
  }

  /**
   * Returns class of a plugin used by function with given id
   *
   * @param {string} functionId - id of a function, e.g. 'SUMIF'
   */
  public static getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return FunctionRegistry.getFunctionPlugin(functionId)
  }

  /**
   * Returns classes of all plugins registered in this instance of HyperFormula
   */
  public static getPlugins(): FunctionPluginDefinition[] {
    return FunctionRegistry.getPlugins()
  }

  /**
   * Builds an empty engine instance.
   * Can be configured with the optional parameter that represents a [[ConfigParams]].
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Partial<ConfigParams>} [configInput] - engine configuration
   *
   * @category Factory
   */
  public static buildEmpty(configInput?: Partial<ConfigParams>): HyperFormula {
    return this.buildFromEngineState(BuildEngineFactory.buildEmpty(configInput))
  }

  private readonly _emitter: Emitter = new Emitter()
  private _evaluationSuspended: boolean = false

  protected constructor(
    private _config: Config,
    private _stats: Statistics,
    private _dependencyGraph: DependencyGraph,
    private _columnSearch: ColumnSearchStrategy,
    private _parser: ParserWithCaching,
    private _unparser: Unparser,
    private _cellContentParser: CellContentParser,
    private _evaluator: Evaluator,
    private _lazilyTransformingAstService: LazilyTransformingAstService,
    private _crudOperations: CrudOperations,
    private _exporter: Exporter,
    private _namedExpressions: NamedExpressions,
    private _serialization: Serialization,
    private _functionRegistry: FunctionRegistry,
  ) {
  }

  /**
   * Returns the cell value of a given address.
   * Applies rounding and post-processing.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @throws Throws an error if the sheet ID is unknown
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @category Cell
   */
  public getCellValue(cellAddress: SimpleCellAddress): CellValue {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getCellValue(cellAddress)
  }

  private ensureEvaluationIsNotSuspended() {
    if (this._evaluationSuspended) {
      throw new EvaluationSuspendedError()
    }
  }

  /**
   * Returns a normalized formula string from the cell of a given address or `undefined` for an address that does not exist and empty values.
   * Unparses AST.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @category Cell
   */
  public getCellFormula(cellAddress: SimpleCellAddress): Maybe<string> {
    return this._serialization.getCellFormula(cellAddress)
  }

  /**
   * Returns [[CellValue]] which a serialized content of the cell of a given address either a cell formula, an explicit value, or an error.
   * Unparses AST and applies post-processing.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @category Cell
   */
  public getCellSerialized(cellAddress: SimpleCellAddress): NoErrorCellValue {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getCellSerialized(cellAddress)
  }

  /**
   * Returns an array of arrays of [[CellValue]] with values of all cells from [[Sheet]].
   * Applies rounding and post-processing.
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @param {number} sheetId - sheet ID number
   *
   * @category Sheet
   */
  public getSheetValues(sheetId: number): CellValue[][] {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getSheetValues(sheetId)
  }

  /**
   * Returns an array with normalized formula strings from [[Sheet]] or `undefined` for a cells that have no value.
   * Unparses AST.
   *
   * @param {SimpleCellAddress} sheetId - sheet ID number
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @category Sheet
   */
  public getSheetFormulas(sheetId: number): Maybe<string>[][] {
    return this._serialization.getSheetFormulas(sheetId)
  }

  /**
   * Returns an array of arrays of [[NoErrorCellValue]] with serialized content of cells from [[Sheet]], either a cell formula or an explicit value.
   * Unparses AST. Applies post-processing.
   *
   * @param {SimpleCellAddress} sheetId - sheet ID number
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @category Sheet
   */
  public getSheetSerialized(sheetId: number): NoErrorCellValue[][] {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getSheetSerialized(sheetId)
  }

  /**
   * Returns a map containing dimensions of all sheets for the engine instance represented as a key-value pairs where keys are sheet IDs and dimensions are returned as numbers, width and height respectively.
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @category Sheet
   */
  public getAllSheetsDimensions(): Record<string, SheetDimensions> {
    return this._serialization.genericAllSheetsGetter((arg) => this.getSheetDimensions(arg))
  }

  /**
   * Returns dimensions of a specified sheet.
   * The sheet dimensions is represented with numbers: width and height.
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @param {number} sheetId - sheet ID number
   *
   * @category Sheet
   */
  public getSheetDimensions(sheetId: number): SheetDimensions {
    return {
      width: this.dependencyGraph.getSheetWidth(sheetId),
      height: this.dependencyGraph.getSheetHeight(sheetId),
    }
  }

  /**
   * Returns values of all sheets in a form of an object which property keys are strings and values are arrays of arrays of [[CellValue]]
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @category Sheet
   */
  public getAllSheetsValues(): Record<string, CellValue[][]> {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getAllSheetsValues()
  }

  /**
   * Returns formulas of all sheets in a form of an object which property keys are strings and values are arrays of arrays of strings or possibly `undefined`
   *
   * @category Sheet
   */
  public getAllSheetsFormulas(): Record<string, Maybe<string>[][]> {
    return this._serialization.getAllSheetsFormulas()
  }

  /**
   * Returns formulas or values of all sheets in a form of an object which property keys are strings and values are arrays of arrays of [[CellValue]]
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @category Sheet
   */
  public getAllSheetsSerialized(): Record<string, NoErrorCellValue[][]> {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getAllSheetsSerialized()
  }

  /**
   * Updates the config with given new parameters.
   *
   * @param {Partial<ConfigParams>} newParams configuration options to be updated or added
   *
   * @category Instance
   */
  public updateConfig(newParams: Partial<ConfigParams>): void {
    const newConfig = this._config.mergeConfig(newParams)

    const configNewLanguage = this._config.mergeConfig({language: newParams.language})
    const serializedSheets = this._serialization.withNewConfig(configNewLanguage).getAllSheetsSerialized()

    const newEngine = BuildEngineFactory.rebuildWithConfig(newConfig, serializedSheets, this._stats)

    this._config = newEngine.config
    this._stats = newEngine.stats
    this._dependencyGraph = newEngine.dependencyGraph
    this._columnSearch = newEngine.columnSearch
    this._parser = newEngine.parser
    this._unparser = newEngine.unparser
    this._cellContentParser = newEngine.cellContentParser
    this._evaluator = newEngine.evaluator
    this._lazilyTransformingAstService = newEngine.lazilyTransformingAstService
    this._crudOperations = newEngine.crudOperations
    this._exporter = newEngine.exporter
    this._namedExpressions = newEngine.namedExpressions
    this._serialization = newEngine.serialization
    this._functionRegistry = newEngine.functionRegistry
  }

  /**
   * Returns current configuration of the engine instance.
   *
   * @category Instance
   */
  public getConfig(): ConfigParams {
    return this._config.getConfig()
  }

  /**
   * Serializes and deserializes whole engine, effectively reloading it.
   *
   * @category Instance
   */
  public rebuildAndRecalculate(): void {
    this.updateConfig({})
  }

  /**
   * Returns a snapshot of computation time statistics.
   * It returns a map with key-value pairs where keys are enums for stat type and time (number)
   *
   * @category Instance
   */
  public getStats(): Map<StatType, number> {
    return this._stats.snapshot()
  }

  /**
   * Undo the previous operation.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoOperationToUndoError]] when there is no operation running that can be undone
   *
   * @category UndoRedo
   */
  public undo(): ExportedChange[] {
    this._crudOperations.undo()
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Re-do recently undone operation.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @fires [[valuesUpdated]]
   *
   * @throws [[NoOperationToRedoError]] when there is no operation running that can be re-done
   *
   * @category UndoRedo
   */
  public redo(): ExportedChange[] {
    this._crudOperations.redo()
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Checks if there is at least one operation that can be undone.
   *
   * @category UndoRedo
   */
  public isThereSomethingToUndo() {
    return this._crudOperations.isThereSomethingToUndo()
  }

  /**
   * Checks if there is at least one operation that can be re-done.
   *
   * @category UndoRedo
   */
  public isThereSomethingToRedo() {
    return this._crudOperations.isThereSomethingToRedo()
  }

  /**
   * Returns information whether it is possible to change the content in a rectangular area bounded by the box.
   * If returns `true`, doing [[setCellContents]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside selected cells, the address is invalid or the sheet does not exist
   *
   * @param {SimpleCellAddress} topLeftCornerAddress -  top left corner of block of cells
   * @param {number} width - width of the box
   * @param {number} height - height of the box
   *
   * @category Cell
   */
  public isItPossibleToSetCellContents(topLeftCornerAddress: SimpleCellAddress, width: number = 1, height: number = 1): boolean {
    try {
      this._crudOperations.ensureRangeInSizeLimits(AbsoluteCellRange.spanFrom(topLeftCornerAddress, width, height))
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          this._crudOperations.ensureItIsPossibleToChangeContent({ col: topLeftCornerAddress.col + i, row: topLeftCornerAddress.row + j, sheet: topLeftCornerAddress.sheet })
        }
      }
    } catch (e) {
      return false
    }
    return true
  }

  /**
   * Sets the content for a block of cells of a given coordinates.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {SimpleCellAddress} topLeftCornerAddress - top left corner of block of cells
   * @param {(RawCellContent[][]|RawCellContent)} cellContents - array with content
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the value is not an array of arrays or a raw cell value
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws an error when it is an attempt to set cells content inside matrices during batch operation
   *
   * @category Cell
   */
  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): ExportedChange[] {
    this._crudOperations.setCellContents(topLeftCornerAddress, cellContents)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to add rows into a specified position in a given sheet.
   * Checks against particular rules to ascertain that addRows can be called.
   * If returns `true`, doing [[addRows]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
   *
   * @param {number} sheetId - sheet ID in which rows will be added
   * @param {Index[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   *
   * @category Row
   */
  public isItPossibleToAddRows(sheetId: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeAddedIndexes(indexes)
    try {
      this._crudOperations.ensureItIsPossibleToAddRows(sheetId, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds multiple rows into a specified position in a given sheet.
   * Does nothing if rows are outside of effective sheet size.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - sheet ID in which rows will be added
   * @param {Index[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws an error if the selected position has matrix inside
   *
   * @category Row
   */
  public addRows(sheetId: number, ...indexes: Index[]): ExportedChange[] {
    this._crudOperations.addRows(sheetId, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove rows from a specified position in a given sheet.
   * Checks against particular rules to ascertain that removeRows can be called.
   * If returns `true`, doing [[removeRows]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
   *
   * @param {number} sheetId - sheet ID from which rows will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [row, amount]
   *
   * @category Row
   */
  public isItPossibleToRemoveRows(sheetId: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeRemovedIndexes(indexes)
    try {
      this._crudOperations.ensureItIsPossibleToRemoveRows(sheetId, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes multiple rows from a specified position in a given sheet.
   * Does nothing if rows are outside of the effective sheet size.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - sheet ID from which rows will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [row, amount]
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws an error when the selected position has matrix inside
   *
   * @category Row
   */
  public removeRows(sheetId: number, ...indexes: Index[]): ExportedChange[] {
    this._crudOperations.removeRows(sheetId, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to add columns into a specified position in a given sheet.
   * Checks against particular rules to ascertain that addColumns can be called.
   * If returns `true`, doing [[addColumns]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
   *
   * @param {number} sheetId - sheet ID in which columns will be added
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   *
   * @category Column
   */
  public isItPossibleToAddColumns(sheetId: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeAddedIndexes(indexes)
    try {
      this._crudOperations.ensureItIsPossibleToAddColumns(sheetId, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds multiple columns into a specified position in a given sheet.
   * Does nothing if the columns are outside of the effective sheet size.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - sheet ID in which columns will be added
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws an error when the selected position has matrix inside
   *
   * @category Column
   */
  public addColumns(sheetId: number, ...indexes: Index[]): ExportedChange[] {
    this._crudOperations.addColumns(sheetId, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove columns from a specified position in a given sheet.
   * Checks against particular rules to ascertain that removeColumns can be called.
   * If returns `true`, doing [[removeColumns]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
   *
   * @param {number} sheetId - sheet ID from which columns will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format [column, amount]
   *
   * @category Column
   */
  public isItPossibleToRemoveColumns(sheetId: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeRemovedIndexes(indexes)
    try {
      this._crudOperations.ensureItIsPossibleToRemoveColumns(sheetId, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes multiple columns from a specified position in a given sheet.
   * Does nothing if columns are outside of the effective sheet size.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - sheet ID from which columns will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount]
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws an error when the selected position has matrix inside
   *
   * @category Column
   */
  public removeColumns(sheetId: number, ...indexes: Index[]): ExportedChange[] {
    this._crudOperations.removeColumns(sheetId, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move cells to a specified position in a given sheet.
   * Checks against particular rules to ascertain that moveCells can be called.
   * If returns `true`, doing [[moveCells]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a moved block
   * @param {number} width - width of the cell block that is being moved
   * @param {number} height - height of the cell block that is being moved
   * @param {SimpleCellAddress} destinationLeftCorner - upper left address of the target cell block
   *
   * @category Cell
   */
  public isItPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): boolean {
    try {
      this._crudOperations.operations.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves the content of a cell block from source to the target location.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a moved block
   * @param {number} width - width of the cell block that is being moved
   * @param {number} height - height of the cell block that is being moved
   * @param {SimpleCellAddress} destinationLeftCorner - upper left address of the target cell block
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws an error when the source location has matrix inside - matrix cannot be moved
   * @throws an error when the target location has matrix inside - cells cannot be replaced by the matrix
   *
   * @category Cell
   */
  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): ExportedChange[] {
    this._crudOperations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of rows to a specified position in a given sheet.
   * Checks against particular rules to ascertain that moveRows can be called.
   * If returns `true`, doing [[moveRows]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows, the target location has matrix or the provided address is invalid.
   *
   * @param {number} sheetId - a sheet number in which the operation will be performed
   * @param {number} startRow - number of the first row to move
   * @param {number} numberOfRows - number of rows to move
   * @param {number} targetRow - row number before which rows will be moved
   *
   * @category Row
   */
  public isItPossibleToMoveRows(sheetId: number, startRow: number, numberOfRows: number, targetRow: number): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToMoveRows(sheetId, startRow, numberOfRows, targetRow)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves a particular number of rows to a specified position in a given sheet.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - a sheet number in which the operation will be performed
   * @param {number} startRow - number of the first row to move
   * @param {number} numberOfRows - number of rows to move
   * @param {number} targetRow - row number before which rows will be moved
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws an error when the source location has matrix inside - matrix cannot be moved
   *
   * @category Row
   */
  public moveRows(sheetId: number, startRow: number, numberOfRows: number, targetRow: number): ExportedChange[] {
    this._crudOperations.moveRows(sheetId, startRow, numberOfRows, targetRow)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of columns to a specified position in a given sheet.
   * Checks against particular rules to ascertain that moveColumns can be called.
   * If returns `true`, doing [[moveColumns]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   *
   * @param {number} sheetId - a sheet number in which the operation will be performed
   * @param {number} startColumn - number of the first column to move
   * @param {number} numberOfColumns - number of columns to move
   * @param {number} targetColumn - column number before which columns will be moved
   *
   * @category Column
   */
  public isItPossibleToMoveColumns(sheetId: number, startColumn: number, numberOfColumns: number, targetColumn: number): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToMoveColumns(sheetId, startColumn, numberOfColumns, targetColumn)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves a particular number of columns to a specified position in a given sheet.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheetId - a sheet number in which the operation will be performed
   * @param {number} startColumn - number of the first column to move
   * @param {number} numberOfColumns - number of columns to move
   * @param {number} targetColumn - column number before which columns will be moved
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws an error when the source location has matrix inside - matrix cannot be moved
   *
   * @category Column
   */
  public moveColumns(sheetId: number, startColumn: number, numberOfColumns: number, targetColumn: number): ExportedChange[] {
    this._crudOperations.moveColumns(sheetId, startColumn, numberOfColumns, targetColumn)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Stores a copy of the cell block in internal clipboard for the further paste.
   * Returns values of cells for use in external clipboard.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a copied block
   * @param {number} width - width of the cell block being copied
   * @param {number} height - height of the cell block being copied
   *
   * @throws an error while attempting to copy unsupported content type
   *
   * @category Clipboard
  */
  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this._crudOperations.copy(sourceLeftCorner, width, height)
    return this.getRangeValues(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * Stores information of the cell block in internal clipboard for further paste.
   * Calling [[paste]] right after this method is equivalent to call [[moveCells]].
   * Almost any CRUD operation called after this method will abort the cut operation.
   * Returns values of cells for use in external clipboard.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a copied block
   * @param {number} width - width of the cell block being copied
   * @param {number} height - height of the cell block being copied
   *
   * @category Clipboard
   */
  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this._crudOperations.cut(sourceLeftCorner, width, height)
    return this.getRangeValues(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * When called after [[copy]] it will paste copied values and formulas into a cell block.
   * When called after [[paste]] it will perform [[moveCells]] operation into the cell block.
   * Does nothing if the clipboard is empty.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {SimpleCellAddress} targetLeftCorner - upper left address of the target cell block
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws an error while attempting to paste onto a matrix
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   *
   * @category Clipboard
   */
  public paste(targetLeftCorner: SimpleCellAddress): ExportedChange[] {
    this.ensureEvaluationIsNotSuspended()
    this._crudOperations.paste(targetLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether there is something in the clipboard.
   *
   * @category Clipboard
   */
  public isClipboardEmpty(): boolean {
    return this._crudOperations.isClipboardEmpty()
  }

  /**
   * Clears the clipboard content by setting the content to `undefined`.
   *
   * @category Clipboard
   */
  public clearClipboard(): void {
    this._crudOperations.clearClipboard()
  }

  /**
   * Returns the cell content of a given range in a [[CellValue]][][] format.
   *
   * @param {AbsoluteCellRange} cellRange absolute cell range
   *
   * @category Range
   */
  public getRangeValues(cellRange: AbsoluteCellRange): CellValue[][] {
    return cellRange.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellValue(address)
      )
    )
  }

  /**
   * Returns cell formulas in given range.
   *
   * @param {AbsoluteCellRange} cellRange absolute cell range
   *
   * @category Range
   */
  public getRangeFormulas(cellRange: AbsoluteCellRange): Maybe<string>[][] {
    return cellRange.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellFormula(address)
      )
    )
  }

  /**
   * Returns serialized cell in given range.
   *
   * @param {AbsoluteCellRange} cellRange absolute cell range
   *
   * @category Range
   */
  public getRangeSerialized(cellRange: AbsoluteCellRange): CellValue[][] {
    return cellRange.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellSerialized(address)
      )
    )
  }

  /**
   * Returns information whether it is possible to add a sheet to the engine.
   * Checks against particular rules to ascertain that addSheet can be called.
   * If returns `true`, doing [[addSheet]] operation won't throw any errors and it possible to add sheet with provided name.
   * Returns `false` if the chosen name is already used.
   *
   * @param {string} sheetName - sheet name, case insensitive
   *
   * @category Sheet
   */
  public isItPossibleToAddSheet(sheetName: string): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToAddSheet(sheetName)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds a new sheet to the HyperFormula instance. Returns given or autogenerated name of a new sheet.
   *
   * @param {string} [sheetName] - if not specified, name will be autogenerated
   *
   * @fires [[sheetAdded]] after the sheet was added
   *
   * @throws an error when sheet with a given name already exists
   *
   * @category Sheet
   */
  public addSheet(sheetName?: string): string {
    const addedSheetName = this._crudOperations.addSheet(sheetName)
    this._emitter.emit(Events.SheetAdded, addedSheetName)
    return addedSheetName
  }

  /**
   * Returns information whether it is possible to remove sheet for the engine.
   * Returns `true` if the provided name of a sheet exists and therefore it can be removed, doing [[removeSheet]] operation won't throw any errors.
   * Returns `false` if there is no sheet with a given name
   *
   * @param {string} sheetName - sheet name, case insensitive
   *
   * @category Sheet
   */
  public isItPossibleToRemoveSheet(sheetName: string): boolean {
    try {
      this._crudOperations.ensureSheetExists(sheetName)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes sheet with a specified name.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} sheetName - sheet name, case insensitive
   *
   * @fires [[sheetRemoved]] after the sheet was removed
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @category Sheet
   */
  public removeSheet(sheetName: string): ExportedChange[] {
    const displayName = this.sheetMapping.getDisplayNameByName(sheetName)!
    this._crudOperations.removeSheet(sheetName)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this._emitter.emit(Events.SheetRemoved, displayName, changes)
    return changes
  }

  /**
   * Returns information whether it is possible to clear a specified sheet.
   * If returns `true`, doing [[clearSheet]] operation won't throw any errors, provided name of a sheet exists and then its content can be cleared.
   * Returns `false` if there is no sheet with a given name
   *
   * @param {string} sheetName - sheet name, case insensitive.
   *
   * @category Sheet
   */
  public isItPossibleToClearSheet(sheetName: string): boolean {
    try {
      this._crudOperations.ensureSheetExists(sheetName)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Clears the sheet content. Based on that the method finds the ID of a sheet to be cleared.
   * Double-checks if the sheet exists.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @category Sheet
   */
  public clearSheet(sheetName: string): ExportedChange[] {
    this._crudOperations.ensureSheetExists(sheetName)
    this._crudOperations.clearSheet(sheetName)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to replace the sheet content.
   * If returns `true`, doing [[setSheetContent]] operation won't throw any errors, the provided name of a sheet exists and then its content can be replaced.
   * Returns `false` if there is no sheet with a given name
   *
   * @param {string} sheetName - sheet name, case insensitive.
   * @param {RawCellContent[][]} values - array of new values
   *
   * @category Sheet
   */
  public isItPossibleToReplaceSheetContent(sheetName: string, values: RawCellContent[][]): boolean {
    try {
      this._crudOperations.ensureSheetExists(sheetName)
      const sheetId = this.sheetMapping.fetch(sheetName)
      this._crudOperations.ensureItIsPossibleToChangeSheetContents(sheetId, values)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Replaces the sheet content with new values.
   * The new value is to be provided as an array of arrays of [[RawCellContent]]
   * The method finds sheet ID based on the provided sheet name.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   * @param {RawCellContent[][]} values - array of new values
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @category Sheet
   */
  public setSheetContent(sheetName: string, values: RawCellContent[][]): ExportedChange[] {
    this._crudOperations.setSheetContent(sheetName, values)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Computes simple (absolute) address of a cell address based on its string representation.
   * If sheet name is present in string representation but not present in the engine, returns `undefined`.
   * If sheet name is not present in string representation, returns the sheet number.
   * Returns an absolute representation of address, e.g. `{ sheet: 0, col: 1, row: 1 }` for `Sheet1!B2`
   *
   * @param {string} cellAddress - string representation of cell address in A1 notation, e.g. 'C64'
   * @param {number} sheetId - override sheet index regardless of sheet mapping
   *
   * @category Helper
   */
  public simpleCellAddressFromString(cellAddress: string, sheetId: number) {
    return simpleCellAddressFromString(this.sheetMapping.get, cellAddress, sheetId)
  }

  /**
   * Returns string representation of an absolute address in A1 notation or `undefined` if the sheet index is not present in the engine.
   *
   * @param {SimpleCellAddress} cellAddress - object representation of an absolute address
   * @param {number} sheetId - if is not equal with address sheet index, string representation will contain sheet name
   *
   * @category Helper
   */
  public simpleCellAddressToString(cellAddress: SimpleCellAddress, sheetId: number): Maybe<string> {
    return simpleCellAddressToString(this.sheetMapping.fetchDisplayName, cellAddress, sheetId)
  }

  /**
   * Returns a unique sheet name assigned to the sheet of a given ID or `undefined` if the there is no sheet with a given ID.
   *
   * @param {number} sheetId - ID of the sheet, for which we want to retrieve name
   *
   * @category Sheet
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this.sheetMapping.getDisplayName(sheetId)
  }

  /**
   * Returns a unique sheet ID assigned to the sheet with a given name or `undefined` if the sheet does not exist.
   *
   * @param {string} sheetName - name of the sheet, for which we want to retrieve ID, case insensitive.
   *
   * @category Sheet
   */
  public getSheetId(sheetName: string): Maybe<number> {
    return this.sheetMapping.get(sheetName)
  }

  /**
   * Returns `true` whether sheet with a given name exists. The methods accepts sheet name to be checked.
   *
   * @param {string} sheetName - name of the sheet, case insensitive.
   *
   * @category Sheet
   */
  public doesSheetExist(sheetName: string): boolean {
    return this.sheetMapping.hasSheetWithName(sheetName)
  }

  /**
   * Returns type of a specified cell of a given address.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @category Cell
   */
  public getCellType(cellAddress: SimpleCellAddress): CellType {
    const vertex = this.dependencyGraph.getCell(cellAddress)
    return getCellType(vertex)
  }

  /**
   * Returns `true` if the specified cell contains a simple value.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @category Cell
   */
  public doesCellHaveSimpleValue(cellAddress: SimpleCellAddress): boolean {
    return this.getCellType(cellAddress) === CellType.VALUE
  }

  /**
   * Returns `true` if the specified cell contains a formula.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @category Cell
   */
  public doesCellHaveFormula(cellAddress: SimpleCellAddress): boolean {
    return this.getCellType(cellAddress) === CellType.FORMULA
  }

  /**
   * Returns`true` if the specified cell is empty.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @category Cell
   */
  public isCellEmpty(cellAddress: SimpleCellAddress): boolean {
    return this.getCellType(cellAddress) === CellType.EMPTY
  }

  /**
   * Returns `true` if a given cell is a part of a matrix.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @category Cell
   */
  public isCellPartOfMatrix(cellAddress: SimpleCellAddress): boolean {
    return this.getCellType(cellAddress) === CellType.MATRIX
  }

  /**
   * Returns type of the cell value of a given address.
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} cellAddress - cell coordinates
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @category Cell
   */
  public getCellValueType(cellAddress: SimpleCellAddress): CellValueType {
    this.ensureEvaluationIsNotSuspended()
    const value = this.dependencyGraph.getCellValue(cellAddress)
    return getCellValueType(value)
  }

  /**
   * Returns the number of existing sheets.
   *
   * @category Sheet
   */
  public countSheets(): number {
    return this.sheetMapping.numberOfSheets()
  }

  /**
   * Renames a specified sheet.
   *
   * @param {number} sheetId - a sheet number
   * @param {string} newName - a name of the sheet to be given, if is the same as the old one the method does nothing
   *
   * @fires [[sheetRenamed]]
   *
   * @throws Throws an error if the provided sheet ID does not exists.
   *
   * @category Sheet
   */
  public renameSheet(sheetId: number, newName: string): void {
    const oldName = this.sheetMapping.renameSheet(sheetId, newName)
    if (oldName !== undefined) {
      this._emitter.emit(Events.SheetRenamed, oldName, newName)
    }
  }

  /**
   * Runs multiple operations and recomputes formulas at the end.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {(e: IBatchExecutor) => void} batchOperations
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @category Instance
   */
  public batch(batchOperations: (e: IBatchExecutor) => void): ExportedChange[] {
    this.suspendEvaluation()
    this._crudOperations.beginUndoRedoBatchMode()
    try {
      batchOperations(this)
    } catch (e) {
      this._crudOperations.commitUndoRedoBatchMode()
      this.resumeEvaluation()
      throw (e)
    }
    this._crudOperations.commitUndoRedoBatchMode()
    return this.resumeEvaluation()
  }

  /**
   * Suspends the dependency graph recalculation.
   * It allows optimizing the performance.
   * With this method, multiple CRUD operations can be done without triggering recalculation after every operation.
   * Suspending evaluation should result in an overall faster calculation compared to recalculating after each operation separately.
   * To resume the evaluation use [[resumeEvaluation]].
   *
   * @category Batch
   */
  public suspendEvaluation(): void {
    this._evaluationSuspended = true
  }

  /**
   * Resumes the dependency graph recalculation that was suspended with [[suspendEvaluation]].
   * It also triggers the recalculation and returns changes that are a result of all batched operations.
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @category Batch
   */
  public resumeEvaluation(): ExportedChange[] {
    this._evaluationSuspended = false
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Checks if the dependency graph recalculation process is suspended or not.
   *
   * @category Batch
   */
  public isEvaluationSuspended(): boolean {
    return this._evaluationSuspended
  }

  /**
   * Adds a specified named expression.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - a name of the expression to be added
   * @param {RawCellContent} expression - the expression
   *
   * @fires [[namedExpressionAdded]] always, unless [[batch]] mode is used
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NamedExpressionNameIsAlreadyTaken]] when the named expression is not available.
   * @throws [[NamedExpressionNameIsInvalid]] when the named expression is not valid
   *
   * @category Named Expression
   */
  public addNamedExpression(expressionName: string, expression: RawCellContent): ExportedChange[] {
    if (!this._namedExpressions.isNameValid(expressionName)) {
      throw new NamedExpressionNameIsInvalid(expressionName)
    }
    if (!this._namedExpressions.isNameAvailable(expressionName)) {
      throw new NamedExpressionNameIsAlreadyTaken(expressionName)
    }
    this._namedExpressions.addNamedExpression(expressionName, expression)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this._emitter.emit(Events.NamedExpressionAdded, expressionName, changes)
    return changes
  }

  /**
   * Gets specified named expression value.
   * Returns a [[CellValue]] or null if the given named expression does not exists
   *
   * @param {string} expressionName - expression name, case insensitive.
   *
   * @category Named Expression
   */
  public getNamedExpressionValue(expressionName: string): CellValue | null {
    const namedExpressionValue = this._namedExpressions.getNamedExpressionValue(expressionName)
    if (namedExpressionValue === null) {
      return null
    } else {
      return this._exporter.exportValue(namedExpressionValue)
    }
  }

  /**
   * Changes a given named expression to a specified formula.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - an expression name, case insensitive.
   * @param {RawCellContent} newExpression - a new expression
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NamedExpressionDoesNotExist]] when the given expression does not exist.
   *
   * @category Named Expression
   */
  public changeNamedExpression(expressionName: string, newExpression: RawCellContent): ExportedChange[] {
    if (!this._namedExpressions.doesNamedExpressionExist(expressionName)) {
      throw new NamedExpressionDoesNotExist(expressionName)
    }
    this._namedExpressions.changeNamedExpressionExpression(expressionName, newExpression)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Removes a named expression.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - expression name, case insensitive.
   *
   * @fires [[namedExpressionRemoved]]
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @category Named Expression
   */
  public removeNamedExpression(expressionName: string): ExportedChange[] {
    const namedExpressionDisplayName = this._namedExpressions.getDisplayNameByName(expressionName)!
    const actuallyRemoved = this._namedExpressions.removeNamedExpression(expressionName)
    if (actuallyRemoved) {
      const changes = this.recomputeIfDependencyGraphNeedsIt()
      this._emitter.emit(Events.NamedExpressionRemoved, namedExpressionDisplayName, changes)
      return changes
    } else {
      return []
    }
  }

  /**
   * Lists all named expressions.
   * Returns an array of expression names as strings
   *
   * @category Named Expression
   */
  public listNamedExpressions(): string[] {
    return this._namedExpressions.getAllNamedExpressionsNames()
  }

  /**
   * Returns a normalized formula.
   *
   * @param {string} formulaString - a formula, e.g. =SUM(Sheet1!A1:A100)"
   *
   * @throws [[NotAFormulaError]] when the provided string is not a valid formula, i.e does not start with "="
   *
   * @category Helper
   */
  public normalizeFormula(formulaString: string): string {
    const [ast, address] = this.extractTemporaryFormula(formulaString)
    if (!ast) {
      throw new NotAFormulaError()
    }
    return this._unparser.unparse(ast, address)
  }

  /**
   * Calculates fire-and-forget formula, returns the calculated value.
   *
   * @param {string} formulaString - a formula, e.g. "=SUM(Sheet1!A1:A100)"
   * @param {string} sheetName - a name of the sheet in context of which we evaluate formula, case insensitive.
   *
   * @throws [[NotAFormulaError]] when the provided string is not a valid formula, i.e does not start with "="
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @category Helper
   */
  public calculateFormula(formulaString: string, sheetName: string): CellValue {
    this._crudOperations.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)
    const [ast, address] = this.extractTemporaryFormula(formulaString, sheetId)
    if (!ast) {
      throw new NotAFormulaError()
    }
    const internalCellValue = this.evaluator.runAndForget(ast, address)
    return this._exporter.exportValue(internalCellValue)
  }

  /**
   * Validates the formula.
   * If the provided string starts with "=" and is a parsable formula the method returns `true`.
   *
   * @param {string} formulaString - a formula, e.g. "=SUM(Sheet1!A1:A100)"
   *
   * @category Helper
   */
  public validateFormula(formulaString: string): boolean {
    const [ast] = this.extractTemporaryFormula(formulaString)
    if (!ast) {
      return false
    }
    if (ast.type === AstNodeType.ERROR && !ast.error) {
      return false
    }
    return true
  }

  /**
   * Returns translated names of all functions registered in this instance of HyperFormula
   * according to the language set in the configuration
   */
  public getRegisteredFunctionNames(): string[] {
    const language = HyperFormula.getLanguage(this._config.language)
    return language.getFunctionTranslations(this._functionRegistry.getRegisteredFunctionIds())
  }

  /**
   * Returns class of a plugin used by function with given id
   *
   * @param {string} functionId - id of a function, e.g. 'SUMIF'
   */
  public getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return this._functionRegistry.getFunctionPlugin(functionId)
  }

  /**
   * Returns classes of all plugins registered in this instance of HyperFormula
   */
  public getPlugins(): FunctionPluginDefinition[] {
    return this._functionRegistry.getPlugins()
  }

  private extractTemporaryFormula(formulaString: string, sheetId: number = 1): [Ast | false, SimpleCellAddress] {
    const parsedCellContent = this._cellContentParser.parse(formulaString)
    const exampleTemporaryFormulaAddress = { sheet: sheetId, col: 0, row: 0 }
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      return [false, exampleTemporaryFormulaAddress]
    }

    const { ast, errors } = this._parser.parse(parsedCellContent.formula, exampleTemporaryFormulaAddress)

    if (errors.length > 0) {
      return [false, exampleTemporaryFormulaAddress]
    }

    return [ast, exampleTemporaryFormulaAddress]
  }

  /**
   * A method that subscribes to an event.
   *
   * @param {Event} event the name of the event to subscribe to
   * @param {Listener} listener to be called when event is emitted
   *
   * @category Events
   */
  public on<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this._emitter.on(event, listener)
  }

  /**
   * A method that subscribes to an event once.
   *
   * @param {Event} event the name of the event to subscribe to
   * @param {Listener} listener to be called when event is emitted
   *
   * @category Events
   */
  public once<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this._emitter.once(event, listener)
  }

  /**
   * A method that unsubscribe from an event or all events.
   *
   * @param {Event} event the name of the event to subscribe to
   * @param {Listener} listener to be called when event is emitted
   *
   * @category Events
   */
  public off<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this._emitter.off(event, listener)
  }

  /**
   * Destroys instance of HyperFormula.
   * Dependency graph, optimization indexes, statistics and parser are removed.
   *
   * @category Instance
   */
  public destroy(): void {
    this.dependencyGraph.destroy()
    this.columnSearch.destroy()
    this.evaluator.destroy()
    this._parser.destroy()
    this._lazilyTransformingAstService.destroy()
    this._stats.destroy()
    this._crudOperations.clearClipboard()
  }

  /**
   * Runs a recomputation starting from recently changed vertices.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   */
  private recomputeIfDependencyGraphNeedsIt(): ExportedChange[] {
    if (!this._evaluationSuspended) {
      const changes = this._crudOperations.getAndClearContentChanges()
      const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
      this.dependencyGraph.clearRecentlyChangedVertices()

      if (verticesToRecomputeFrom.length > 0) {
        changes.addAll(this.evaluator.partialRun(verticesToRecomputeFrom))
      }

      const exportedChanges = changes.exportChanges(this._exporter)

      if (!changes.isEmpty()) {
        this._emitter.emit(Events.ValuesUpdated, exportedChanges)
      }

      return exportedChanges
    } else {
      return []
    }
  }
}
