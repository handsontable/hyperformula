/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellType, CellValueType, ErrorType, SimpleCellAddress} from './Cell'
import {
  CellValue,
  DetailedCellError,
  ExportedCellChange,
  ExportedChange,
  ExportedNamedExpressionChange,
  NoErrorCellValue
} from './CellValue'
import {HyperFormula} from './HyperFormula'
import {Config, ConfigParams} from './Config'
import {languages, RawTranslationPackage} from './i18n'
import {Sheet, SheetDimensions, Sheets} from './Sheet'
import {RawCellContent} from './CellContentParser'
import {
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  EvaluationSuspendedError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
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
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasMatrixError,
  TargetLocationHasMatrixError,
  UnableToParseError,
} from './errors'
import * as plugins from './interpreter/plugin'
import {FunctionPluginDefinition} from './interpreter'
import {ColumnRowIndex} from './CrudOperations'

/** @internal */
class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static ErrorType = ErrorType
  public static CellType = CellType
  public static CellValueType = CellValueType
  public static DetailedCellError = DetailedCellError
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static ConfigValueTooBigError = ConfigValueTooBigError
  public static ConfigValueTooSmallError = ConfigValueTooSmallError
  public static EvaluationSuspendedError = EvaluationSuspendedError
  public static ExpectedOneOfValuesError = ExpectedOneOfValuesError
  public static ExpectedValueOfTypeError = ExpectedValueOfTypeError
  public static FunctionPluginValidationError = FunctionPluginValidationError
  public static InvalidAddressError = InvalidAddressError
  public static InvalidArgumentsError = InvalidArgumentsError
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
  public static SheetNameAlreadyTakenError = SheetNameAlreadyTakenError
  public static SheetSizeLimitExceededError = SheetSizeLimitExceededError
  public static SourceLocationHasMatrixError = SourceLocationHasMatrixError
  public static TargetLocationHasMatrixError = TargetLocationHasMatrixError
  public static UnableToParseError = UnableToParseError
}

const defaultLanguage = Config.defaultConfig.language
HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])

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
  Sheet,
  Sheets,
  SheetDimensions,
  SimpleCellAddress,
  ColumnRowIndex,
  RawTranslationPackage,
  FunctionPluginDefinition,
  HyperFormula,
  CellType,
  CellValueType,
  ErrorType,
  ExportedCellChange,
  ExportedNamedExpressionChange,
  DetailedCellError,
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  EvaluationSuspendedError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
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
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasMatrixError,
  TargetLocationHasMatrixError,
  UnableToParseError,
}
