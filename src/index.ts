/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {SimpleCellRange} from './AbsoluteCellRange'
import {ArraySize} from './ArraySize'
import {CellError, CellType, CellValueDetailedType, CellValueType, ErrorType, SimpleCellAddress} from './Cell'
import {RawCellContent} from './CellContentParser'
import {CellValue, DetailedCellError, NoErrorCellValue} from './CellValue'
import {Config, ConfigParams} from './Config'
import {ColumnRowIndex} from './CrudOperations'
import {
  AlwaysDense,
  AlwaysSparse,
  DenseSparseChooseBasedOnThreshold
} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  EvaluationSuspendedError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
  LanguageAlreadyRegisteredError,
  LanguageNotRegisteredError,
  MissingTranslationError,
  NamedExpressionDoesNotExistError,
  NamedExpressionNameIsAlreadyTakenError,
  NamedExpressionNameIsInvalidError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoRelativeAddressesAllowedError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NotAFormulaError,
  NothingToPasteError,
  ProtectedFunctionTranslationError,
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasArrayError,
  TargetLocationHasArrayError,
  UnableToParseError
} from './errors'
import {ExportedCellChange, ExportedChange, ExportedNamedExpressionChange} from './Exporter'
import {HyperFormula} from './HyperFormula'
import {RawTranslationPackage} from './i18n'
import enGB from './i18n/languages/enGB'
import {FunctionArgument, FunctionPlugin, FunctionPluginDefinition, FunctionArgumentType, ImplementedFunctions, FunctionMetadata} from './interpreter'
import {FormatInfo} from './interpreter/InterpreterValue'
import * as plugins from './interpreter/plugin'
import {SimpleRangeValue} from './SimpleRangeValue'
import {NamedExpression, NamedExpressionOptions} from './NamedExpressions'
import {SerializedNamedExpression} from './Serialization'
import {Sheet, SheetDimensions, Sheets} from './Sheet'

/**
 * Aggregate class for default export
 */
class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static ErrorType = ErrorType
  public static CellType = CellType
  public static CellValueType = CellValueType
  public static CellValueDetailedType = CellValueDetailedType
  public static DetailedCellError = DetailedCellError
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static ConfigValueTooBigError = ConfigValueTooBigError
  public static ConfigValueTooSmallError = ConfigValueTooSmallError
  public static EvaluationSuspendedError = EvaluationSuspendedError
  public static ExpectedOneOfValuesError = ExpectedOneOfValuesError
  public static ExpectedValueOfTypeError = ExpectedValueOfTypeError
  public static ArraySize = ArraySize
  public static FunctionPlugin = FunctionPlugin
  public static FunctionArgumentType = FunctionArgumentType
  public static FunctionPluginValidationError = FunctionPluginValidationError
  public static InvalidAddressError = InvalidAddressError
  public static InvalidArgumentsError = InvalidArgumentsError
  public static LanguageNotRegisteredError = LanguageNotRegisteredError
  public static LanguageAlreadyRegisteredError = LanguageAlreadyRegisteredError
  public static MissingTranslationError = MissingTranslationError
  public static NamedExpressionDoesNotExistError = NamedExpressionDoesNotExistError
  public static NamedExpressionNameIsAlreadyTakenError = NamedExpressionNameIsAlreadyTakenError
  public static NamedExpressionNameIsInvalidError = NamedExpressionNameIsInvalidError
  public static NoOperationToRedoError = NoOperationToRedoError
  public static NoOperationToUndoError = NoOperationToUndoError
  public static NoRelativeAddressesAllowedError = NoRelativeAddressesAllowedError
  public static NoSheetWithIdError = NoSheetWithIdError
  public static NoSheetWithNameError = NoSheetWithNameError
  public static NotAFormulaError = NotAFormulaError
  public static NothingToPasteError = NothingToPasteError
  public static ProtectedFunctionTranslationError = ProtectedFunctionTranslationError
  public static SheetNameAlreadyTakenError = SheetNameAlreadyTakenError
  public static SheetSizeLimitExceededError = SheetSizeLimitExceededError
  public static SourceLocationHasArrayError = SourceLocationHasArrayError
  public static TargetLocationHasArrayError = TargetLocationHasArrayError
  public static UnableToParseError = UnableToParseError
}

const defaultLanguage = Config.defaultConfig.language

HyperFormula.registerLanguage(defaultLanguage, enGB)
HyperFormula.languages[enGB.langCode] = enGB

for (const pluginName of Object.getOwnPropertyNames(plugins)) {
  if (!pluginName.startsWith('_')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    HyperFormula.registerFunctionPlugin(plugins[pluginName])
  }
}

export default HyperFormulaNS

export {
  AlwaysDense,
  AlwaysSparse,
  DenseSparseChooseBasedOnThreshold,
  CellValue,
  NoErrorCellValue,
  ConfigParams,
  ExportedChange,
  RawCellContent,
  FormatInfo,
  Sheet,
  Sheets,
  SheetDimensions,
  SimpleCellAddress,
  SimpleCellRange,
  ColumnRowIndex,
  RawTranslationPackage,
  FunctionPluginDefinition,
  FunctionArgument,
  NamedExpression,
  NamedExpressionOptions,
  HyperFormula,
  CellType,
  CellValueType,
  CellValueDetailedType,
  ErrorType,
  ExportedCellChange,
  ExportedNamedExpressionChange,
  DetailedCellError,
  CellError,
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  EvaluationSuspendedError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError,
  ArraySize,
  FunctionPlugin,
  ImplementedFunctions,
  FunctionMetadata,
  FunctionArgumentType,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
  LanguageAlreadyRegisteredError,
  LanguageNotRegisteredError,
  MissingTranslationError,
  NamedExpressionDoesNotExistError,
  NamedExpressionNameIsAlreadyTakenError,
  NamedExpressionNameIsInvalidError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoRelativeAddressesAllowedError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NotAFormulaError,
  NothingToPasteError,
  ProtectedFunctionTranslationError,
  SimpleRangeValue,
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasArrayError,
  TargetLocationHasArrayError,
  UnableToParseError,
  SerializedNamedExpression,
}
