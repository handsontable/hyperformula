/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellType, CellValueType, getCellType, getCellValueType, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {CellValue, ExportedChange, Exporter, NoErrorCellValue} from './CellValue'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {ColumnRowIndex, CrudOperations} from './CrudOperations'
import {DateTime} from './DateTimeHelper'
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
  LanguageAlreadyRegisteredError,
  LanguageNotRegisteredError,
  NotAFormulaError
} from './errors'
import {Evaluator} from './Evaluator'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Maybe} from './Maybe'
import {NamedExpression, NamedExpressionOptions, NamedExpressions} from './NamedExpressions'
import {
  Ast,
  AstNodeType,
  ParserWithCaching,
  RelativeDependency,
  simpleCellAddressFromString,
  simpleCellAddressToString,
  Unparser,
} from './parser'
import {Serialization} from './Serialization'
import {Statistics, StatType} from './statistics'
import {Emitter, Events, Listeners, TypedEmitter} from './Emitter'
import {BuildEngineFactory, EngineState} from './BuildEngineFactory'
import {Sheet, SheetDimensions, Sheets} from './Sheet'
import {LicenseKeyValidityState} from './helpers/licenseKeyValidator'
import {FunctionPluginDefinition} from './interpreter'
import {FunctionRegistry, FunctionTranslationsPackage} from './interpreter/FunctionRegistry'

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
   *
   * @category Static Properties
   */
  public static version = process.env.HT_VERSION as string

  /**
   * Latest build date.
   *
   * @category Static Properties
   */
  public static buildDate = process.env.HT_BUILD_DATE as string

  /**
   * A release date.
   *
   * @category Static Properties
   */
  public static releaseDate = process.env.HT_RELEASE_DATE as string

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

  /**
   * Returns state of the validity of the license key.
   *
   * @internal
   */
  public get licenseKeyValidityState(): LicenseKeyValidityState {
    return this._config.licenseKeyValidityState
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
   * @param {Partial<ConfigParams>} configInput - engine configuration
   *
   * @throws [[SheetSizeLimitExceededError]] when sheet size exceeds the limits
   * @throws [[InvalidArgumentsError]] when sheet is not an array of arrays
   * @throws [[FunctionPluginValidationError]] when plugin class definition is not consistent with metadata
   *
   * @example
   * ```js
   * // data represented as an array
   * const sheetData = [
   *  ['0', '=SUM(1,2,3)', '52'],
   *  ['=SUM(A1:C1)', '', '=A1'],
   *  ['2', '=SUM(A1:C1)', '91'],
   * ];
   *
   * // method with optional config parameter maxColumns
   * const hfInstance = HyperFormula.buildFromArray(sheetData, { maxColumns: 1000 });
   * ```
   *
   * @category Factories
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
   * @param {Partial<ConfigParams>} configInput - engine configuration
   *
   * @throws [[SheetSizeLimitExceededError]] when sheet size exceeds the limits
   * @throws [[InvalidArgumentsError]] when any sheet is not an array of arrays
   * @throws [[FunctionPluginValidationError]] when plugin class definition is not consistent with metadata
   *
   * @example
   * ```js
   * // data represented as an object with sheets: Sheet1 and Sheet2
   * const sheetData = {
   *  'Sheet1': [
   *    ['1', '', '=Sheet2!$A1'],
   *    ['', '2', '=SUM(1,2,3)'],
   *    ['=Sheet2!$A2', '2', ''],
   *   ],
   *  'Sheet2': [
   *    ['', '4', '=Sheet1!$B1'],
   *    ['', '8', '=SUM(9,3,3)'],
   *    ['=Sheet1!$B1', '2', ''],
   *   ],
   * };
   *
   * // method with optional config parameter useColumnIndex
   * const hfInstance = HyperFormula.buildFromSheets(sheetData, { useColumnIndex: true });
   * ```
   *
   * @category Factories
   */
  public static buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): HyperFormula {
    return this.buildFromEngineState(BuildEngineFactory.buildFromSheets(sheets, configInput))
  }

  /**
   * Builds an empty engine instance.
   * Can be configured with the optional parameter that represents a [[ConfigParams]].
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Partial<ConfigParams>} configInput - engine configuration
   *
   * @example
   * ```js
   * // build with no initial data and with optional config parameter maxColumns
   * const hfInstance = HyperFormula.buildEmpty({ maxColumns: 1000 });
   * ```
   *
   * @category Factories
   */
  public static buildEmpty(configInput?: Partial<ConfigParams>): HyperFormula {
    return this.buildFromEngineState(BuildEngineFactory.buildEmpty(configInput))
  }

  private static registeredLanguages: Map<string, TranslationPackage> = new Map()

  /**
   * Returns registered language from its code string.
   *
   * @param {string} languageCode - code string of the translation package
   *
   * @throws [[LanguageNotRegisteredError]] when trying to retrieve not registered language
   *
   * @example
   * ```js
   * // return registered language
   * const language = HyperFormula.getLanguage('enGB');
   * ```
   *
   * @category Static Methods
   */
  public static getLanguage(languageCode: string): TranslationPackage {
    const val = this.registeredLanguages.get(languageCode)
    if (val === undefined) {
      throw new LanguageNotRegisteredError()
    } else {
      return val
    }
  }

  /**
   * Registers language from under given code string.
   *
   * @param {string} languageCode - code string of the translation package
   * @param {RawTranslationPackage} languagePackage - translation package to be registered
   *
   * @throws [[ProtectedFunctionTranslationError]] when trying to register translation for protected function
   * @throws [[LanguageAlreadyRegisteredError]] when given language is already registered
   *
   * @example
   * ```js
   * // return registered language
   * HyperFormula.registerLanguage('plPL', plPL);
   * ```
   *
   * @category Static Methods
   */
  public static registerLanguage(languageCode: string, languagePackage: RawTranslationPackage): void {
    if (this.registeredLanguages.has(languageCode)) {
      throw new LanguageAlreadyRegisteredError()
    } else {
      this.registeredLanguages.set(languageCode, buildTranslationPackage(languagePackage))
    }
  }

  /**
   * Unregisters language that is registered under given code string.
   *
   * @param {string} languageCode - code string of the translation package
   *
   * @throws [[LanguageNotRegisteredError]] when given language is not registered
   *
   * @example
   * ```js
   * // register the language for the instance
   * HyperFormula.registerLanguage('plPL', plPL);
   *
   * // unregister plPL
   * HyperFormula.unregisterLanguage('plPL');
   * ```
   *
   * @category Static Methods
   */
  public static unregisterLanguage(languageCode: string): void {
    if (this.registeredLanguages.has(languageCode)) {
      this.registeredLanguages.delete(languageCode)
    } else {
      throw new LanguageNotRegisteredError()
    }
  }

  /**
   * Returns all registered languages codes.
   *
   * @example
   * ```js
   * // should return all registered language codes: ['enGB', 'plPL']
   * const registeredLangugaes = HyperFormula.getRegisteredLanguagesCodes();
   * ```
   *
   * @category Static Methods
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
   * @throws [[ProtectedFunctionTranslationError]] when trying to register translation for protected function
   *
   * @category Static Methods
   */
  public static registerFunctionPlugin(plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    FunctionRegistry.registerFunctionPlugin(plugin, translations)
  }

  /**
   * Unregisters all functions defined in given plugin
   *
   * @param {FunctionPluginDefinition} plugin - plugin class
   *
   * @category Static Methods
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
   * @throws [[ProtectedFunctionTranslationError]] when trying to register translation for protected function
   *
   * @category Static Methods
   */
  public static registerFunction(functionId: string, plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    FunctionRegistry.registerFunction(functionId, plugin, translations)
  }

  /**
   * Unregisters a function with a given id
   *
   * @param {string} functionId - function id, e.g. 'SUMIF'
   *
   * @category Static Methods
   */
  public static unregisterFunction(functionId: string): void {
    FunctionRegistry.unregisterFunction(functionId)
  }

  /**
   * Clears function registry
   *
   * @category Static Methods
   */
  public static unregisterAllFunctions(): void {
    FunctionRegistry.unregisterAll()
  }

  /**
   * Returns translated names of all registered functions for a given language
   *
   * @param {string} code - language code
   *
   * @category Static Methods
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
   *
   * @category Static Methods
   */
  public static getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return FunctionRegistry.getFunctionPlugin(functionId)
  }

  /**
   * Returns classes of all plugins registered in this instance of HyperFormula
   *
   * @category Static Methods
   */
  public static getAllFunctionPlugins(): FunctionPluginDefinition[] {
    return FunctionRegistry.getPlugins()
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
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2,3)', '2'],
   * ]);
   *
   * // get value of A1 cell, should be '6'
   * const A1Value = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });
   *
   * // get value of B1 cell, should be '2'
   * const B1Value = hfInstance.getCellValue({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2,3)', '0'],
   * ]);
   *
   * // should return a normalized A1 cell formula: '=SUM(1,2,3)'
   * const A1Formula = hfInstance.getCellFormula({ sheet: 0, col: 0, row: 0 });
   *
   * // should return a normalized B1 cell formula: 'undefined'
   * const B1Formula = hfInstance.getCellFormula({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2,3)', '0'],
   * ]);
   *
   * // should return serialized content of A1 cell: '=SUM(1,2,3)'
   * const cellA1Serialized = hfInstance.getCellSerialized({ sheet: 0, col: 0, row: 0 });
   *
   * // should return serialized content of B1 cell: '0'
   * const cellB1Serialized = hfInstance.getCellSerialized({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['0', '=SUM(1,2,3)', '=A1'],
   *  ['1', '=TEXT(A2, "0.0%")', '=C1'],
   *  ['2', '=SUM(A1:C1)', '=C1'],
   * ]);
   *
   * // should return all values of a sheet: [[0, 6, 0], [1, '1.0%', 0], [2, 6, 0]]
   * const sheetValues = hfInstance.getSheetValues(0);
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['0', '=SUM(1,2,3)', '=A1'],
   *  ['1', '=TEXT(A2, "0.0%")', '=C1'],
   *  ['2', '=SUM(A1:C1)', '=C1'],
   * ]);
   *
   * // should return all formulas of a sheet:
   * // [
   * //  [undefined, '=SUM(1,2,3)', '=A1'],
   * //  [undefined, '=TEXT(A2, "0.0%")', '=C1'],
   * //  [undefined, '=SUM(A1:C1)', '=C1'],
   * // ];
   * const sheetFormulas = hfInstance.getSheetFormulas(0);
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['0', '=SUM(1,2,3)', '=A1'],
   *  ['1', '=TEXT(A2, "0.0%")', '=C1'],
   *  ['2', '=SUM(A1:C1)', '=C1'],
   * ]);
   *
   * // should return:
   * // [
   * //  ['0', '=SUM(1,2,3)', '=A1'],
   * //  ['1', '=TEXT(A2, "0.0%")', '=C1'],
   * //  ['2', '=SUM(A1:C1)', '=C1'],
   * // ];
   * const serializedContent = hfInstance.getSheetSerialized(0);
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   Sheet1: [
   *    ['1', '2', '=Sheet2!$A1'],
   *   ],
   *   Sheet2: [
   *    ['3'],
   *    ['4'],
   *   ],
   * });
   *
   * // should return the dimensions of all sheets:
   * // { Sheet1: { width: 3, height: 1 }, Sheet2: { width: 1, height: 2 } }
   * const allSheetsDimensions = hfInstance.getAllSheetsDimensions();
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *    ['1', '2', '=Sheet2!$A1'],
   * ]);
   *
   * // should return provided sheet's dimensions: { width: 3, height: 1 }
   * const sheetDimensions = hfInstance.getSheetDimensions(0);
   * ```
   *
   * @category Sheets
   */
  public getSheetDimensions(sheetId: number): SheetDimensions {
    return {
      width: this.dependencyGraph.getSheetWidth(sheetId),
      height: this.dependencyGraph.getSheetHeight(sheetId),
    }
  }

  /**
   * Returns values of all sheets in a form of an object which property keys are strings and values are arrays of arrays of [[CellValue]].
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '=A1+10', '3'],
   * ]);
   *
   * // should return all sheets values: { Sheet1: [ [ 1, 11, 3 ] ] }
   * const allSheetsValues = hfInstance.getAllSheetsValues();
   * ```
   *
   * @category Sheets
   */
  public getAllSheetsValues(): Record<string, CellValue[][]> {
    this.ensureEvaluationIsNotSuspended()
    return this._serialization.getAllSheetsValues()
  }

  /**
   * Returns formulas of all sheets in a form of an object which property keys are strings and values are arrays of arrays of strings or possibly `undefined`.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2', '=A1+10'],
   * ]);
   *
   * // should return only formulas: { Sheet1: [ [ undefined, undefined, '=A1+10' ] ] }
   * const allSheetsFormulas = hfInstance.getAllSheetsFormulas();
   * ```
   * @category Sheets
   */
  public getAllSheetsFormulas(): Record<string, Maybe<string>[][]> {
    return this._serialization.getAllSheetsFormulas()
  }

  /**
   * Returns formulas or values of all sheets in a form of an object which property keys are strings and values are arrays of arrays of [[CellValue]].
   *
   * @throws [[EvaluationSuspendedError]] when the evaluation is suspended
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2', '=A1+10'],
   * ]);
   *
   * // should return all sheets serialized content: { Sheet1: [ [ 1, 2, '=A1+10' ] ] }
   * const allSheetsSerialized = hfInstance.getAllSheetsSerialized();
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // add a config param, for example maxColumns,
   * // you can check the configuration with getConfig method
   * hfInstance.updateConfig({ maxColumns: 1000 });
   * ```
   *
   * @category Instance
   */
  public updateConfig(newParams: Partial<ConfigParams>): void {
    const newConfig = this._config.mergeConfig(newParams)

    const configNewLanguage = this._config.mergeConfig({language: newParams.language})
    const serializedSheets = this._serialization.withNewConfig(configNewLanguage, this._namedExpressions).getAllSheetsSerialized()

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
   * @example
   * ```js
   * // should return all config parameters including default and those which were added
   * const hfConfig = hfInstance.getConfig();
   * ```
   *
   * @category Instance
   */
  public getConfig(): ConfigParams {
    return this._config.getConfig()
  }

  /**
   * Serializes and deserializes whole engine, effectively reloading it.
   *
   * @example
   * ```js
   * hfInstance.rebuildAndRecalculate();
   * ```
   *
   * @category Instance
   */
  public rebuildAndRecalculate(): void {
    this.updateConfig({})
  }

  /**
   * Returns a snapshot of computation time statistics.
   * It returns a map with key-value pairs where keys are enums for stat type and time (number).
   *
   * @internal
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   *  ['3', ''],
   * ]);
   *
   * // perform CRUD operation, for example remove the second row
   * hfInstance.removeRows(0, [1, 1]);
   *
   * // do an undo, it should return the changes
   * const changes = hfInstance.undo();
   * ```
   *
   * @category Undo and Redo
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
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoOperationToRedoError]] when there is no operation running that can be re-done
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   *  ['3'],
   * ]);
   *
   * // perform CRUD operation, for example remove the second row
   * hfInstance.removeRows(0, [1, 1]);
   *
   * // do an undo, it should return prvious values: [['1'], ['2'], ['3']]
   * hfInstance.undo();
   *
   * // do a redo, it should return the values after removing the second row: [['1'], ['3']]
   * const changes = hfInstance.redo();
   * ```
   *
   * @category Undo and Redo
   */
  public redo(): ExportedChange[] {
    this._crudOperations.redo()
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Checks if there is at least one operation that can be undone.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   *  ['3'],
   * ]);
   *
   * // perform CRUD operation, for example remove the second row
   * hfInstance.removeRows(0, [1, 1]);
   *
   * // should return 'true', it is possible to undo last operation
   * // which is removing rows in this example
   * const isSomethingToUndo = hfInstance.isThereSomethingToUndo();
   * ```
   *
   * @category Undo and Redo
   */
  public isThereSomethingToUndo(): boolean {
    return this._crudOperations.isThereSomethingToUndo()
  }

  /**
   * Checks if there is at least one operation that can be re-done.
   *
   * @example
   * ```js
   * hfInstance.undo();
   *
   * // when there is an action to redo, this will return 'true'
   * const isSomethingToRedo = hfInstance.isThereSomethingToRedo();
   * ```
   *
   * @category Undo and Redo
   */
  public isThereSomethingToRedo(): boolean {
    return this._crudOperations.isThereSomethingToRedo()
  }

  /**
   * Returns information whether it is possible to change the content in a rectangular area bounded by the box.
   * If returns `true`, doing [[setCellContents]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside selected cells, the address is invalid or the sheet does not exist.
   *
   * @param {SimpleCellAddress} topLeftCornerAddress -  top left corner of block of cells
   * @param {number} width - width of the box
   * @param {number} height - height of the box
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // choose the address and assign it to a variable
   * const address = { col: 0, row: 0, sheet: 0 };
   *
   * // should return 'true' for this example, it is possible to set content of
   * // width 2, height 1 in the first row and column of sheet 0
   * const isSettable = hfInstance.isItPossibleToSetCellContents(address, 2, 1);
   * ```
   *
   * @category Cells
   */
  public isItPossibleToSetCellContents(topLeftCornerAddress: SimpleCellAddress, width: number = 1, height: number = 1): boolean {
    try {
      this._crudOperations.ensureRangeInSizeLimits(AbsoluteCellRange.spanFrom(topLeftCornerAddress, width, height))
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          this._crudOperations.ensureItIsPossibleToChangeContent({
            col: topLeftCornerAddress.col + i,
            row: topLeftCornerAddress.row + j,
            sheet: topLeftCornerAddress.sheet
          })
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2', '=A1'],
   * ]);
   *
   * // should set the content, returns:
   * // [{
   * //   address: { sheet: 0, col: 3, row: 0 },
   * //   newValue: 2,
   * // }]
   * const changes = hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
   * ```
   *
   * @category Cells
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2', '3'],
   * ]);
   *
   * // should return 'true' for this example,
   * // it is possible to add one row in the second row of sheet 0
   * const isAddable = hfInstance.isItPossibleToAddRows(0, [1, 1]);
   * ```
   *
   * @category Rows
   */
  public isItPossibleToAddRows(sheetId: number, ...indexes: ColumnRowIndex[]): boolean {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws [[TargetLocationHasMatrixError]] when the selected position has matrix inside
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   * ]);
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values
   * const changes = hfInstance.addRows(0, [0, 1]);
   * ```
   *
   * @category Rows
   */
  public addRows(sheetId: number, ...indexes: ColumnRowIndex[]): ExportedChange[] {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format: [row, amount]
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   * ]);
   *
   * // should return 'true' for this example
   * // it is possible to remove one row from row 1 of sheet 0
   * const isRemovable = hfInstance.isItPossibleToRemoveRows(0, [1, 1]);
   * ```
   *
   * @category Rows
   */
  public isItPossibleToRemoveRows(sheetId: number, ...indexes: ColumnRowIndex[]): boolean {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format: [row, amount]
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[SourceLocationHasMatrixError]] when the selected position has matrix inside
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   * ]);
   *
   * // should return: [{ sheet: 0, col: 1, row: 2, value: null }] for this example
   * const changes = hfInstance.removeRows(0, [1, 1]);
   * ```
   *
   * @category Rows
   */
  public removeRows(sheetId: number, ...indexes: ColumnRowIndex[]): ExportedChange[] {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return 'true' for this example,
   * // it is possible to add 1 column in sheet 0, at column 1
   * const isAddable = hfInstance.isItPossibleToAddColumns(0, [1, 1]);
   * ```
   *
   * @category Columns
   */
  public isItPossibleToAddColumns(sheetId: number, ...indexes: ColumnRowIndex[]): boolean {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[SheetSizeLimitExceededError]] when performing this operation would result in sheet size limits exceeding
   * @throws [[TargetLocationHasMatrixError]] when the selected position has matrix inside
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=RAND()', '42'],
   * ]);
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, for this example:
   * // [{
   * //   address: { sheet: 0, col: 1, row: 0 },
   * //   newValue: 0.92754862796338,
   * // }]
   * const changes = hfInstance.addColumns(0, [0, 1]);
   * ```
   *
   * @category Columns
   */
  public addColumns(sheetId: number, ...indexes: ColumnRowIndex[]): ExportedChange[] {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format [column, amount]
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return 'true' for this example
   * // it is possible to remove one column, in place of the second column of sheet 0
   * const isRemovable = hfInstance.isItPossibleToRemoveColumns(0, [1, 1]);
   * ```
   *
   * @category Columns
   */
  public isItPossibleToRemoveColumns(sheetId: number, ...indexes: ColumnRowIndex[]): boolean {
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
   * @param {ColumnRowIndex[]} indexes - non-contiguous indexes with format: [column, amount]
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   * @throws [[InvalidArgumentsError]] when the given arguments are invalid
   * @throws [[SourceLocationHasMatrixError]] when the selected position has matrix inside
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['0', '=SUM(1,2,3)', '=A1'],
   * ]);
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, in this example it will return:
   * // [{
   * //   address: { sheet: 0, col: 1, row: 0 },
   * //   newValue: { error: [CellError], value: '#REF!' },
   * // }]
   * const changes = hfInstance.removeColumns(0, [0, 1]);
   * ```
   *
   * @category Columns
   */
  public removeColumns(sheetId: number, ...indexes: ColumnRowIndex[]): ExportedChange[] {
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // choose the coordinates and assign them to variables
   * const source = { sheet: 0, col: 1, row: 0 };
   * const destination = { sheet: 0, col: 3, row: 0 };
   *
   * // should return 'true' for this example
   * // it is possible to move a block of width 1 and height 1
   * // from the corner: column 1 and row 0 of sheet 0
   * // into destination corner: column 3, row 0 of sheet 0
   * const isMovable = hfInstance.isItPossibleToMoveCells(source, 1, 1, destination);
   * ```
   * @category Cells
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
   * @throws [[SourceLocationHasMatrixError]] when the source location has matrix inside - matrix cannot be moved
   * @throws [[TargetLocationHasMatrixError]] when the target location has matrix inside - cells cannot be replaced by the matrix
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=RAND()', '42'],
   * ]);
   *
   * // choose the coordinates and assign them to variables
   * const source = { sheet: 0, col: 1, row: 0 };
   * const destination = { sheet: 0, col: 3, row: 0 };
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, for this example:
   * // [{
   * //   address: { sheet: 0, col: 0, row: 0 },
   * //   newValue: 0.93524248002062,
   * // }]
   * const changes = hfInstance.moveCells(source, 1, 1, destination);
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   * ]);
   *
   * // should return 'true' for this example
   * // it is possible to move one row from row 0 into row 2
   * const isMovable = hfInstance.isItPossibleToMoveRows(0, 0, 1, 2);
   * ```
   *
   * @category Rows
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
   * @throws [[SourceLocationHasMatrixError]] when the source location has matrix inside - matrix cannot be moved
   * @throws [[TargetLocationHasMatrixError]] when the target location has matrix inside - cells cannot be replaced by the matrix
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1'],
   *  ['2'],
   * ]);
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values
   * const changes = hfInstance.moveRows(0, 0, 1, 2);
   * ```
   *
   * @category Rows
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return 'true' for this example
   * // it is possible to move one column from column 1 into column 2 of sheet 0
   * const isMovable = hfInstance.isItPossibleToMoveColumns(0, 1, 1, 2);
   * ```
   *
   * @category Columns
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
   * @throws [[SourceLocationHasMatrixError]] when the source location has matrix inside - matrix cannot be moved
   * @throws [[TargetLocationHasMatrixError]] when the target location has matrix inside - cells cannot be replaced by the matrix
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2', '3', '=RAND()', '=SUM(A1:C1)'],
   * ]);
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, for this example:
   * // [{
   * //   address: { sheet: 0, col: 1, row: 0 },
   * //   newValue: 0.16210054671639,
   * //  }, {
   * //   address: { sheet: 0, col: 4, row: 0 },
   * //   newValue: 6.16210054671639,
   * // }]
   * const changes = hfInstance.moveColumns(0, 1, 1, 2);
   * ```
   *
   * @category Columns
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return: [ [ 2 ] ]
   * const clipboardContent = hfInstance.copy({ sheet: 0, col: 1, row: 0 }, 1, 1);
   * ```
   *
   * @category Clipboard
   */
  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this._crudOperations.copy(sourceLeftCorner, width, height)
    return this.getRangeValues(sourceLeftCorner, width, height)
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return values that were cut: [ [ 1 ] ]
   * const clipboardContent = hfInstance.cut({ sheet: 0, col: 0, row: 0 }, 1, 1);
   * ```
   *
   * @category Clipboard
   */
  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this._crudOperations.cut(sourceLeftCorner, width, height)
    return this.getRangeValues(sourceLeftCorner, width, height)
  }

  /**
   * When called after [[copy]] it will paste copied values and formulas into a cell block.
   * When called after [[cut]] it will perform [[moveCells]] operation into the cell block.
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
   * @throws [[NothingToPasteError]] when clipboard is empty
   * @throws [[TargetLocationHasMatrixError]] when the selected target area has matrix inside
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // do a copy, [ [ 2 ] ] was copied
   * hfInstance.copy({ sheet: 0, col: 0, row: 0 }, 1, 1);
   *
   * // do a paste, should return a list of cells which values changed
   * // after the operation, their absolute addresses and new values
   * const changes = hfInstance.paste({ sheet: 0, col: 1, row: 0 });
   * ```
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // copy desired content
   * hfInstance.copy({ sheet: 0, col: 1, row: 0 }, 1, 1);
   *
   * // returns 'false', there is content in the clipboard
   * const isClipboardEmpty = hfInstance.isClipboardEmpty();
   * ```
   *
   * @category Clipboard
   */
  public isClipboardEmpty(): boolean {
    return this._crudOperations.isClipboardEmpty()
  }

  /**
   * Clears the clipboard content by setting the content to `undefined`.
   *
   * @example
   * ```js
   * // clears the clipboard, isClipboardEmpty() should return true if called afterwards
   * hfInstance.clearClipboard();
   * ```
   *
   * @category Clipboard
   */
  public clearClipboard(): void {
    this._crudOperations.clearClipboard()
  }

  /**
   * Returns the cell content of a given range in a [[CellValue]][][] format.
   *
   * @param {SimpleCellAddress} leftCorner - address of the upper left corner of a range
   * @param {number} width - width of a range
   * @param {number} height - height of a range
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2)', '2', '10'],
   *  ['5', '6', '7'],
   *  ['40', '30', '20'],
   * ]);
   *
   *
   * // returns calculated cells content: [ [ 3, 2 ], [ 5, 6 ] ]
   * const rangeValues = hfInstance.getRangeValues({ sheet: 0, col: 0, row: 0 }, 2, 2);
   * ```
   *
   * @category Ranges
   */
  public getRangeValues(leftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    const cellRange = AbsoluteCellRange.spanFrom(leftCorner, width, height)
    return cellRange.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellValue(address)
      )
    )
  }

  /**
   * Returns cell formulas in given range.
   *
   * @param {SimpleCellAddress} leftCorner - address of the upper left corner of a range
   * @param {number} width - width of a range
   * @param {number} height - height of a range
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2)', '2', '10'],
   *  ['5', '6', '7'],
   *  ['40', '30', '20'],
   * ]);
   *
   * // returns cell formulas of a given range only:
   * // [ [ '=SUM(1,2)', undefined ], [ undefined, undefined ] ]
   * const rangeFormulas = hfInstance.getRangeFormulas({ sheet: 0, col: 0, row: 0 }, 2, 2);
   * ```
   *
   * @category Ranges
   */
  public getRangeFormulas(leftCorner: SimpleCellAddress, width: number, height: number): Maybe<string>[][] {
    const cellRange = AbsoluteCellRange.spanFrom(leftCorner, width, height)
    return cellRange.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellFormula(address)
      )
    )
  }

  /**
   * Returns serialized cells in given range.
   *
   * @param {SimpleCellAddress} leftCorner - address of the upper left corner of a range
   * @param {number} width - width of a range
   * @param {number} height - height of a range
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2)', '2', '10'],
   *  ['5', '6', '7'],
   *  ['40', '30', '20'],
   * ]);
   *
   * // should return serialized cell content for the given range:
   * // [ [ '=SUM(1,2)', 2 ], [ 5, 6 ] ]
   * const rangeSerialized = hfInstance.getRangeSerialized({ sheet: 0, col: 0, row: 0 }, 2, 2);
   * ```
   *
   * @category Ranges
   */
  public getRangeSerialized(leftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    const cellRange = AbsoluteCellRange.spanFrom(leftCorner, width, height)
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'false' because 'MySheet2' already exists
   * const isAddable = hfInstance.isItPossibleToAddSheet('MySheet2');
   * ```
   *
   * @category Sheets
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
   * @throws [[SheetNameAlreadyTaken]] when sheet with a given name already exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'MySheet3'
   * const nameProvided = hfInstance.addSheet('MySheet3');
   *
   * // should return autogenerated 'Sheet4'
   * // because no name was provided and 3 other ones already exist
   * const generatedName = hfInstance.addSheet();
   * ```
   *
   * @category Sheets
   */
  public addSheet(sheetName?: string): string {
    const addedSheetName = this._crudOperations.addSheet(sheetName)
    this._emitter.emit(Events.SheetAdded, addedSheetName)
    return addedSheetName
  }

  /**
   * Returns information whether it is possible to remove sheet for the engine.
   * Returns `true` if the provided name of a sheet exists and therefore it can be removed, doing [[removeSheet]] operation won't throw any errors.
   * Returns `false` if there is no sheet with a given name.
   *
   * @param {string} sheetName - sheet name, case insensitive
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'true' because 'MySheet2' exists and is removable
   * const isRemovable = hfInstance.isItPossibleToRemoveSheet('MySheet2');
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, in this example it will return:
   * // [{
   * //   address: { sheet: 0, col: 0, row: 0 },
   * //   newValue: { error: [CellError], value: '#REF!' },
   * // }]
   * const changes = hfInstance.removeSheet('MySheet2');
   * ```
   *
   * @category Sheets
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
   * Returns `false` if there is no sheet with a given name.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'true' because 'MySheet2' exists and can be cleared
   * const isClearable = hfInstance.isItPossibleToClearSheet('MySheet2');
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values, in this example it will return:
   * // [{
   * //   address: { sheet: 0, col: 0, row: 0 },
   * //   newValue: 0,
   * // }]
   * const changes = hfInstance.clearSheet('MySheet2');
   * ```
   *
   * @category Sheets
   */
  public clearSheet(sheetName: string): ExportedChange[] {
    this._crudOperations.ensureSheetExists(sheetName)
    this._crudOperations.clearSheet(sheetName)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to replace the sheet content.
   * If returns `true`, doing [[setSheetContent]] operation won't throw any errors, the provided name of a sheet exists and then its content can be replaced.
   * Returns `false` if there is no sheet with a given name.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   * @param {RawCellContent[][]} values - array of new values
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'true' because 'MySheet1' exists
   * // and the provided content can be placed in this sheet
   * const isReplaceable = hfInstance.isItPossibleToReplaceSheetContent('MySheet1', [['50'], ['60']]);
   * ```
   *
   * @category Sheets
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
   * The new value is to be provided as an array of arrays of [[RawCellContent]].
   * The method finds sheet ID based on the provided sheet name.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   * @param {RawCellContent[][]} values - array of new values
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   * @throws [[InvalidArgumentsError]] when values is not an array of arrays
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return a list of cells which values changed after the operation,
   * // their absolute addresses and new values
   * const changes = hfInstance.setSheetContent('MySheet1', [['50'], ['60']]);
   * ```
   *
   * @category Sheets
   */
  public setSheetContent(sheetName: string, values: RawCellContent[][]): ExportedChange[] {
    this._crudOperations.setSheetContent(sheetName, values)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Computes simple (absolute) address of a cell address based on its string representation.
   * If sheet name is present in string representation but not present in the engine, returns `undefined`.
   * If sheet name is not present in string representation, returns the sheet number.
   * Returns an absolute representation of address.
   *
   * @param {string} cellAddress - string representation of cell address in A1 notation
   * @param {number} sheetId - override sheet index regardless of sheet mapping
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // should return { sheet: 0, col: 0, row: 0 }
   * const simpleCellAddress = hfInstance.simpleCellAddressFromString('A1', 0);
   * ```
   *
   * @category Helpers
   */
  public simpleCellAddressFromString(cellAddress: string, sheetId: number): Maybe<SimpleCellAddress> {
    return simpleCellAddressFromString(this.sheetMapping.get, cellAddress, sheetId)
  }

  /**
   * Returns string representation of an absolute address in A1 notation or `undefined` if the sheet index is not present in the engine.
   *
   * @param {SimpleCellAddress} cellAddress - object representation of an absolute address
   * @param {number} sheetId - if is not equal with address sheet index, string representation will contain sheet name
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // should return 'B2'
   * const A1Notation = hfInstance.simpleCellAddressToString({ sheet: 0, col: 1, row: 1 }, 0);
   * ```
   *
   * @category Helpers
   */
  public simpleCellAddressToString(cellAddress: SimpleCellAddress, sheetId: number): Maybe<string> {
    return simpleCellAddressToString(this.sheetMapping.fetchDisplayName, cellAddress, sheetId)
  }

  /**
   * Returns a unique sheet name assigned to the sheet of a given ID or `undefined` if the there is no sheet with a given ID.
   *
   * @param {number} sheetId - ID of the sheet, for which we want to retrieve name
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'MySheet2' as this sheet is the second one
   * const sheetName = hfInstance.getSheetName(1);
   * ```
   *
   * @category Sheets
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this.sheetMapping.getDisplayName(sheetId)
  }

  /**
   * List all sheet names.
   * Returns an array of sheet names as strings.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  MySheet1: [ ['1'] ],
   *  MySheet2: [ ['10'] ],
   * });
   *
   * // should return all sheets names: ['MySheet1', 'MySheet2']
   * const sheetNames = hfInstance.getSheetNames();
   * ```
   *
   * @category Sheets
   */
  public getSheetNames(): string[] {
    return this.sheetMapping.sheetNames()
  }

  /**
   * Returns a unique sheet ID assigned to the sheet with a given name or `undefined` if the sheet does not exist.
   *
   * @param {string} sheetName - name of the sheet, for which we want to retrieve ID, case insensitive.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // should return '0' because 'MySheet1' is of ID '0'
   * const sheetID = hfInstance.getSheetId('MySheet1');
   * ```
   *
   * @category Sheets
   */
  public getSheetId(sheetName: string): Maybe<number> {
    return this.sheetMapping.get(sheetName)
  }

  /**
   * Returns `true` whether sheet with a given name exists. The methods accepts sheet name to be checked.
   *
   * @param {string} sheetName - name of the sheet, case insensitive.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // should return 'true' since 'MySheet1' exists
   * const sheetExist = hfInstance.doesSheetExist('MySheet1');
   * ```
   *
   * @category Sheets
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(A2:A3)', '2'],
   * ]);
   *
   * // should return 'FORMULA', the cell of given coordinates is of this type
   * const cellA1Type = hfInstance.getCellType({ sheet: 0, col: 0, row: 0 });
   *
   * // should return 'VALUE', the cell of given coordinates is of this type
   * const cellB1Type = hfInstance.getCellType({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(A2:A3)', '2'],
   * ]);
   *
   * // should return 'false' since the selcted cell contains a simple value
   * const isA1Simple = hfInstance.doesCellHaveSimpleValue({ sheet: 0, col: 0, row: 0 });
   *
   * // should return 'true' since the selcted cell does not contain a simple value
   * const isB1Simple = hfInstance.doesCellHaveSimpleValue({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(A2:A3)', '2'],
   * ]);
   *
   * // should return 'true' since the A1 cell contains a formula
   * const A1Formula = hfInstance.doesCellHaveFormula({ sheet: 0, col: 0, row: 0 });
   *
   * // should return 'false' since the B1 cell does not contain a formula
   * const B1NoFormula = hfInstance.doesCellHaveFormula({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *   [null, '1'],
   * ]);
   *
   * // should return 'true', cell of provided coordinates is empty
   * const isEmpty = hfInstance.isCellEmpty({ sheet: 0, col: 0, row: 0 });
   *
   * // should return 'false', cell of provided coordinates is not empty
   * const isNotEmpty = hfInstance.isCellEmpty({ sheet: 0, col: 1, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *    ['{=TRANSPOSE(B1:B1)}'],
   * ]);
   *
   * // should return 'true', cell of provided coordinates is a part of a matrix
   * const isPartOfMatrix = hfInstance.isCellPartOfMatrix({ sheet: 0, col: 0, row: 0 });
   * ```
   *
   * @category Cells
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['=SUM(1,2,3)', '2'],
   * ]);
   *
   * // should return 'NUMBER', cell value type of provided coordinates is a number
   * const cellValue = hfInstance.getCellValueType({ sheet: 0, col: 1, row: 0 });
   *
   * // should return 'NUMBER', cell value type of provided coordinates is a number
   * const cellValue = hfInstance.getCellValueType({ sheet: 0, col: 0, row: 0 });
   * ```
   *
   * @category Cells
   */
  public getCellValueType(cellAddress: SimpleCellAddress): CellValueType {
    this.ensureEvaluationIsNotSuspended()
    const value = this.dependencyGraph.getCellValue(cellAddress)
    return getCellValueType(value)
  }

  /**
   * Returns the number of existing sheets.
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['1', '2'],
   * ]);
   *
   * // should return the number of sheets which is '1'
   * const sheetsCount = hfInstance.countSheets();
   * ```
   *
   * @category Sheets
   */
  public countSheets(): number {
    return this.sheetMapping.numberOfSheets()
  }

  /**
   * Returns information whether it is possible to rename sheet.
   * Returns `true` if the sheet with provided id exists and new name is available
   * Returns `false` if sheet cannot be renamed
   *
   * @param {number} sheetId - a sheet number
   * @param {string} newName - a name of the sheet to be given
   *
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // returns true
   * hfInstance.isItPossibleToRenameSheet(0, 'MySheet0');
   * ```
   *
   * @category Sheets
   */
  public isItPossibleToRenameSheet(sheetId: number, newName: string): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToRenameSheet(sheetId, newName)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Renames a specified sheet.
   *
   * @param {number} sheetId - a sheet number
   * @param {string} newName - a name of the sheet to be given, if is the same as the old one the method does nothing
   *
   * @fires [[sheetRenamed]] after the sheet was renamed
   *
   * @throws [[NoSheetWithIdError]] when the given sheet ID does not exist
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // renames the sheet 'MySheet1'
   * hfInstance.renameSheet(0, 'MySheet0');
   * ```
   *
   * @category Sheets
   */
  public renameSheet(sheetId: number, newName: string): void {
    const oldName = this._crudOperations.renameSheet(sheetId, newName)
    if (oldName !== undefined) {
      this._emitter.emit(Events.SheetRenamed, oldName, newName)
    }
  }

  /**
   * Runs multiple operations and recomputes formulas at the end.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {() => void} batchOperations
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // multiple operations in a single callback will trigger evaluation only once
   * // and only one set of changes is returned as a combined result of all
   * // the operations that were triggered within the callback
   * const changes = hfInstance.batch(() => {
   *   hfInstance.addRows(0, [1, 1]);
   *   hfInstance.removeColumns(0, [1, 1]);
   * });
   * ```
   *
   * @category Batch
   */
  public batch(batchOperations: () => void): ExportedChange[] {
    this.suspendEvaluation()
    this._crudOperations.beginUndoRedoBatchMode()
    try {
      batchOperations()
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // similar to batch() but operations are not within a callback,
   * // one method suspends the recalculation
   * // the second will resume calculations and return the changes
   *
   * // suspend the evaluation with this method
   * hfInstance.suspendEvaluation();
   *
   * // perform operations
   * hfInstance.addRows(0, [1, 1]);
   * hfInstance.removeColumns(0, [1, 1]);
   *
   * // use resumeEvaluation to resume
   * const changes = hfInstance.resumeEvaluation();
   * ```
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // similar to batch() but operations are not within a callback,
   * // one method suspends the recalculation
   * // the second will resume calculations and return the changes
   *
   * // first, suspend the evaluation
   * hfInstance.suspendEvaluation();
   *
   * // perform operations
   * hfInstance.addRows(0, [1, 1]);
   * hfInstance.removeColumns(0, [1, 1]);
   *
   * // resume the evaluation
   * const changes = hfInstance.resumeEvaluation();
   * ```
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // suspend the evaluation
   * hfInstance.suspendEvaluation();
   *
   * // between suspendEvaluation() and resumeEvaluation()
   * // or inside batch() callback it will return 'true', otherwise 'false'
   * const isEvaluationSuspended = hfInstance.isEvaluationSuspended();
   *
   * const changes = hfInstance.resumeEvaluation();
   * ```
   *
   * @category Batch
   */
  public isEvaluationSuspended(): boolean {
    return this._evaluationSuspended
  }

  /**
   * Returns information whether it is possible to add named expression into a specific scope.
   * Checks against particular rules to ascertain that addNamedExpression can be called.
   * If returns `true`, doing [[addNamedExpression]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted.
   *
   * @param {string} expressionName - a name of the expression to be added
   * @param {RawCellContent} expression - the expression
   * @param {string?} scope - sheet name or undefined for global scope
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // should return 'true' for this example,
   * // it is possible to add named expression to global scope
   * const isAddable = hfInstance.isItPossibleToAddNamedExpression('prettyName', '=Sheet1!$A$1+100');
   * ```
   *
   * @category Named Expressions
   */
  public isItPossibleToAddNamedExpression(expressionName: string, expression: RawCellContent, scope?: string): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToAddNamedExpression(expressionName, expression, scope)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds a specified named expression.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - a name of the expression to be added
   * @param {RawCellContent} expression - the expression
   * @param {string?} scope - scope definition, `sheetName` for local scope or `undefined` for global scope
   * @param {NamedExpressionOptions?} options - additional metadata related to named expression
   *
   * @fires [[namedExpressionAdded]] always, unless [[batch]] mode is used
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NamedExpressionNameIsAlreadyTaken]] when the named expression name is not available.
   * @throws [[NamedExpressionNameIsInvalid]] when the named expression name is not valid
   * @throws [[MatrixFormulasNotSupportedError]] when the named expression formula is a Matrix formula
   * @throws [[NoRelativeAddressesAllowedError]] when the named expression formula contains relative references
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add own expression, scope limited to 'Sheet1', the method should return a list of cells which values
   * // changed after the operation, their absolute addresses and new values
   * // for this example:
   * // [{
   * //   name: 'prettyName',
   * //   newValue: 142,
   * // }]
   * const changes = hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
   * ```
   *
   * @category Named Expressions
   */
  public addNamedExpression(expressionName: string, expression: RawCellContent, scope?: string, options?: NamedExpressionOptions): ExportedChange[] {
    this._crudOperations.addNamedExpression(expressionName, expression, scope, options)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this._emitter.emit(Events.NamedExpressionAdded, expressionName, changes)
    return changes
  }

  /**
   * Gets specified named expression value.
   * Returns a [[CellValue]] or undefined if the given named expression does not exists.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * @param {string?} scope - scope definition, `sheetName` for local scope or `undefined` for global scope
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression, only 'Sheet1' considered as it is the scope
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
   *
   * // returns the calculated value of a passed named expression, '142' for this example
   * const myFormula = hfInstance.getNamedExpressionValue('prettyName', 'Sheet1');
   * ```
   *
   * @category Named Expressions
   */
  public getNamedExpressionValue(expressionName: string, scope?: string): Maybe<CellValue> {
    this.ensureEvaluationIsNotSuspended()
    const sheetId = this._crudOperations.scopeId(scope)
    const namedExpression = this._namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (namedExpression) {
      return this._serialization.getCellValue(namedExpression.address)
    } else {
      return undefined
    }
  }

  /**
   * Returns a normalized formula string for given named expression or `undefined` for a named expression that does not exist or does not hold a formula.
   * Unparses AST.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * @param {string?} scope - scope definition, `sheetName` for local scope or `undefined` for global scope
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression in 'Sheet1'
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
   *
   * // returns a normalized formula string corresponding to a passed name from 'Sheet1',
   * // '=Sheet1!A1+100' for this example
   * const myFormula = hfInstance.getNamedExpressionFormula('prettyName', 'Sheet1');
   * ```
   *
   * @category Named Expressions
   */
  public getNamedExpressionFormula(expressionName: string, scope?: string): Maybe<string> {
    const sheetId = this._crudOperations.scopeId(scope)
    const namedExpression = this._namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (namedExpression === undefined) {
      return undefined
    } else {
      return this._serialization.getCellFormula(namedExpression.address)
    }
  }

  /**
   * Returns named expression a normalized formula string for given named expression or `undefined` for a named expression that does not exist or does not hold a formula.
   * Unparses AST.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * @param {string?} scope - scope definition, `sheetName` for local scope or `undefined` for global scope
   *
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression in 'Sheet1'
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
   *
   * // returns a normalized formula string corresponding to a passed name from 'Sheet1',
   * // '=Sheet1!$A$1+100' for this example
   * const myFormula = hfInstance.getNamedExpression('prettyName', 'Sheet1');
   * ```
   *
   * @category Named Expressions
   */
  public getNamedExpression(expressionName: string, scope?: string): Maybe<NamedExpression> {
    const sheetId = this._crudOperations.scopeId(scope)
    const namedExpression = this._namedExpressions.namedExpressionForScope(expressionName, sheetId)

    if (namedExpression === undefined) {
      return undefined
    }

    const expression = this._serialization.getCellFormula(namedExpression.address)

    return {
      name: expressionName,
      scope: scope,
      expression: expression,
      options: namedExpression.options
    }
  }

  /**
   * Returns information whether it is possible to change named expression in a specific scope.
   * Checks against particular rules to ascertain that changeNamedExpression can be called.
   * If returns `true`, doing [[changeNamedExpression]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted.
   *
   * @param {string} expressionName - an expression name, case insensitive.
   * @param {RawCellContent} newExpression - a new expression
   * @param {string?} scope - sheet name or undefined for global scope
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100');
   *
   * // should return 'true' for this example,
   * // it is possible to change named expression
   * const isAddable = hfInstance.isItPossibleToChangeNamedExpression('prettyName', '=Sheet1!$A$1+100');
   * ```
   *
   * @category Named Expressions
   */
  public isItPossibleToChangeNamedExpression(expressionName: string, newExpression: RawCellContent, scope?: string): boolean {
    try {
      this._crudOperations.ensureItIsPossibleToChangeNamedExpression(expressionName, newExpression, scope)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Changes a given named expression to a specified formula.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - an expression name, case insensitive.
   * @param {RawCellContent} newExpression - a new expression
   * @param {string?} scope - scope definition, `sheetName` for local scope or `undefined` for global scope
   * @param {NamedExpressionOptions?} options - additional metadata related to named expression
   *
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NamedExpressionDoesNotExist]] when the given expression does not exist.
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   * @throws [[MatrixFormulasNotSupportedError]] when the named expression formula is a Matrix formula
   * @throws [[NoRelativeAddressesAllowedError]] when the named expression formula contains relative references
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression, scope limited to 'Sheet1'
   * hfInstance.addNamedExpression('prettyName', 'Sheet1', '=Sheet1!$A$1+100');
   *
   * // change the named expression
   * const changes = hfInstance.changeNamedExpression('prettyName', '=Sheet1!$A$1+200');
   * ```
   *
   * @category Named Expressions
   */
  public changeNamedExpression(expressionName: string, newExpression: RawCellContent, scope?: string, options?: NamedExpressionOptions): ExportedChange[] {
    this._crudOperations.changeNamedExpressionExpression(expressionName, scope, newExpression, options)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove named expression from a specific scope.
   * Checks against particular rules to ascertain that removeNamedExpression can be called.
   * If returns `true`, doing [[removeNamedExpression]] operation won't throw any errors.
   * Returns `false` if the operation might be disrupted.
   *
   * @param {string} expressionName - an expression name, case insensitive.
   * @param {string?} scope - sheet name or undefined for global scope
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100');
   *
   * // should return 'true' for this example,
   * // it is possible to change named expression
   * const isAddable = hfInstance.isItPossibleToRemoveNamedExpression('prettyName');
   * ```
   *
   * @category Named Expressions
   */
  public isItPossibleToRemoveNamedExpression(expressionName: string, scope?: string): boolean {
    try {
      this._crudOperations.isItPossibleToRemoveNamedExpression(expressionName, scope)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes a named expression.
   *
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * @param {string?} sheetScope - scope definition, `sheetName` for local scope or `undefined` for global scope
   *
   * @fires [[namedExpressionRemoved]] after the expression was removed
   * @fires [[valuesUpdated]] if recalculation was triggered by this change
   *
   * @throws [[NamedExpressionDoesNotExist]] when the given expression does not exist.
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   * ]);
   *
   * // add a named expression
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
   *
   * // remove the named expression
   * const changes = hfInstance.removeNamedExpression('prettyName', 'Sheet1');
   * ```
   *
   * @category Named Expressions
   */
  public removeNamedExpression(expressionName: string, scope?: string): ExportedChange[] {
    const removedNamedExpression = this._crudOperations.removeNamedExpression(expressionName, scope)
    if (removedNamedExpression) {
      const changes = this.recomputeIfDependencyGraphNeedsIt()
      this._emitter.emit(Events.NamedExpressionRemoved, removedNamedExpression.displayName, changes)
      return changes
    } else {
      return []
    }
  }

  /**
   * Lists all named expressions.
   * Returns an array of expression names as strings
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   *  ['50'],
   * ]);
   *
   * // add two named expressions
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!A1+100');
   * hfInstance.addNamedExpression('prettyName2', '=Sheet1!A2+100');
   *
   * // list the expressions, should return: ['prettyName', 'prettyName2'] for this example
   * const listOfExpressions = hfInstance.listNamedExpressions();
   * ```
   *
   * @category Named Expressions
   */
  public listNamedExpressions(): string[] {
    return this._namedExpressions.getAllNamedExpressionsNames()
  }

  /**
   * Returns a normalized formula.
   *
   * @param {string} formulaString - a formula in a proper format - it must start with "="
   *
   * @throws [[NotAFormulaError]] when the provided string is not a valid formula, i.e does not start with "="
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *  ['42'],
   *  ['50'],
   * ]);
   *
   * // normalize the formula, should return '=Sheet1!A1+10' for this example
   * const normalizedFormula = hfInstance.normalizeFormula('=SHEET1!A1+10');
   * ```
   *
   * @category Helpers
   */
  public normalizeFormula(formulaString: string): string {
    const [ast, address] = this.extractTemporaryFormula(formulaString)
    if (ast === undefined) {
      throw new NotAFormulaError()
    }
    return this._unparser.unparse(ast, address)
  }

  /**
   * Calculates fire-and-forget formula, returns the calculated value.
   *
   * @param {string} formulaString -  a formula in a proper format - it must start with "="
   * @param {string} sheetName - a name of the sheet in context of which we evaluate formula, case insensitive.
   *
   * @throws [[NotAFormulaError]] when the provided string is not a valid formula, i.e does not start with "="
   * @throws [[NoSheetWithNameError]] when the given sheet name does not exists
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *  Sheet1: [['22']],
   *  Sheet2: [['58']],
   * });
   *
   * // returns the value of calculated formula, '32' for this example
   * const calculatedFormula = hfInstance.calculateFormula('=A1+10', 'Sheet1'));
   * ```
   *
   * @category Helpers
   */
  public calculateFormula(formulaString: string, sheetName: string): CellValue {
    this._crudOperations.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)
    const [ast, address, dependencies] = this.extractTemporaryFormula(formulaString, sheetId)
    if (ast === undefined) {
      throw new NotAFormulaError()
    }
    const internalCellValue = this.evaluator.runAndForget(ast, address, dependencies)
    return this._exporter.exportValue(internalCellValue)
  }

  /**
   * Validates the formula.
   * If the provided string starts with "=" and is a parsable formula the method returns `true`.
   *
   * @param {string} formulaString -  a formula in a proper format - it must start with "="
   *
   * @example
   * ```js
   * // checks if the given string is a valid formula, should return 'true' for this example
   * const isFormula = hfInstance.validateFormula('=SUM(1,2)');
   * ```
   *
   * @category Helpers
   */
  public validateFormula(formulaString: string): boolean {
    const [ast] = this.extractTemporaryFormula(formulaString)
    if (ast === undefined) {
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
   *
   * @category Custom Functions
   */
  public getRegisteredFunctionNames(): string[] {
    const language = HyperFormula.getLanguage(this._config.language)
    return language.getFunctionTranslations(this._functionRegistry.getRegisteredFunctionIds())
  }

  /**
   * Returns class of a plugin used by function with given id
   *
   * @param {string} functionId - id of a function, e.g. 'SUMIF'
   *
   * @category Custom Functions
   */
  public getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return this._functionRegistry.getFunctionPlugin(functionId)
  }

  /**
   * Returns classes of all plugins registered in this instance of HyperFormula
   *
   * @category Custom Functions
   */
  public getAllFunctionPlugins(): FunctionPluginDefinition[] {
    return this._functionRegistry.getPlugins()
  }

  /**
   * Interprets number as a date + time.
   *
   * @param {number} val - number of days since dateZero, should be nonnegative, fractions are interpreted as hours/minutes/seconds.
   *
   * @example
   * ```js
   * HyperFormula.buildEmpty().numberToDateTime(43845.1);
   *
   * // returns {year: 2020, month: 1, day: 15, hours: 2, minutes: 24}
   * ```
   *
   * @category Helper
   */
  public numberToDateTime(val: number): DateTime {
    return this._evaluator.dateHelper.numberToSimpleDateTime(val)
  }

  /**
   * Interprets number as a date.
   *
   * @param {number} val - number of days since dateZero, should be nonnegative, fractions are ignored.

   * @example
   * ```js
   * HyperFormula.buildEmpty().numberToDate(43845);
   *
   * // returns {year: 2020, month: 1, day: 15}
   * ```
   *
   * @category Helper
   */
  public numberToDate(val: number): DateTime {
    return this._evaluator.dateHelper.numberToSimpleDate(val)
  }

  /**
   * Interprets number as a time (hours/minutes/second).
   *
   * @param {number} val - time in 24h units.
   *
   * @example
   * ```js
   * HyperFormula.buildEmpty().numberToTime(1.1);
   *
   * // returns {hours: 26, minutes: 24}
   * ```
   *
   * @category Helper
   */
  public numberToTime(val: number): DateTime {
    return this._evaluator.dateHelper.numberToSimpleTime(val)
  }

  private extractTemporaryFormula(formulaString: string, sheetId: number = 1): [Maybe<Ast>, SimpleCellAddress, RelativeDependency[]] {
    const parsedCellContent = this._cellContentParser.parse(formulaString)
    const exampleTemporaryFormulaAddress = {sheet: sheetId, col: 0, row: 0}
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      return [undefined, exampleTemporaryFormulaAddress, []]
    }

    const {ast, errors, dependencies} = this._parser.parse(parsedCellContent.formula, exampleTemporaryFormulaAddress)

    if (errors.length > 0) {
      return [undefined, exampleTemporaryFormulaAddress, []]
    }

    return [ast, exampleTemporaryFormulaAddress, dependencies]
  }

  /**
   * A method that subscribes to an event.
   *
   * @param {Event} event the name of the event to subscribe to
   * @param {Listener} listener to be called when event is emitted
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // subscribe to a 'sheetAdded', pass a simple handler
   * hfInstance.on('sheetAdded', ( ) => { console.log('foo') });
   *
   * // add a sheet to trigger an event,
   * // console should print 'foo' after each time sheet is added in this example
   * hfInstance.addSheet('FooBar');
   * ```
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // subscribe to a 'sheetAdded', pass a simple handler
   * hfInstance.once('sheetAdded', ( ) => { console.log('foo') });
   *
   * // call addSheet twice,
   * // console should print 'foo' only once when the sheet is added in this example
   * hfInstance.addSheet('FooBar');
   * hfInstance.addSheet('FooBaz');
   * ```
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
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // define a simple function to be called upon emitting an event
   * const handler = ( ) => { console.log('baz') }
   *
   * // subscribe to a 'sheetAdded', pass the handler
   * hfInstance.on('sheetAdded', handler);
   *
   * // add a sheet to trigger an event,
   * // console should print 'baz' each time a sheet is added
   * hfInstance.addSheet('FooBar');
   *
   * // unsubscribe from a 'sheetAdded'
   * hfInstance.off('sheetAdded', handler);
   *
   * // add a sheet, the console should not print anything
   * hfInstance.addSheet('FooBaz');
   * ```
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
   * @example
   * ```js
   * // destroys the instance
   * hfInstance.destroy();
   * ```
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
