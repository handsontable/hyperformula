/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellType, CellValueDetailedType, CellValueType, ErrorType, SimpleCellAddress, CellValueJustNumber, CellValueNoNumber} from './Cell'
import {RawCellContent} from './CellContentParser'
import {CellValue, DetailedCellError, NoErrorCellValue} from './CellValue'
import {Config, ConfigParams} from './Config'
import {ColumnRowIndex} from './CrudOperations'
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
  MatrixFormulasNotSupportedError,
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
  SourceLocationHasMatrixError,
  TargetLocationHasMatrixError,
  UnableToParseError
} from './errors'
import {ExportedCellChange, ExportedChange, ExportedNamedExpressionChange} from './Exporter'
import {HyperFormula} from './HyperFormula'
import {RawTranslationPackage} from './i18n'
import enGB from './i18n/languages/enGB'
import {FunctionArgument, FunctionPlugin, FunctionPluginDefinition} from './interpreter'
import * as plugins from './interpreter/plugin'
import {NamedExpression, NamedExpressionOptions} from './NamedExpressions'
import {Sheet, SheetDimensions, Sheets} from './Sheet'
import {FormatInfo} from './interpreter/InterpreterValue'

/** @internal */
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
  public static FunctionPlugin = FunctionPlugin
  public static FunctionPluginValidationError = FunctionPluginValidationError
  public static InvalidAddressError = InvalidAddressError
  public static InvalidArgumentsError = InvalidArgumentsError
  public static LanguageNotRegisteredError = LanguageNotRegisteredError
  public static LanguageAlreadyRegisteredError = LanguageAlreadyRegisteredError
  public static MatrixFormulasNotSupportedError = MatrixFormulasNotSupportedError
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
  public static SourceLocationHasMatrixError = SourceLocationHasMatrixError
  public static TargetLocationHasMatrixError = TargetLocationHasMatrixError
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
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  EvaluationSuspendedError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError,
  FunctionPlugin,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
  LanguageAlreadyRegisteredError,
  LanguageNotRegisteredError,
  MatrixFormulasNotSupportedError,
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
  SourceLocationHasMatrixError,
  TargetLocationHasMatrixError,
  UnableToParseError,
}
