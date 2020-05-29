/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from './Cell'
import {CellValue, NoErrorCellValue, DetailedCellError, ExportedCellChange, ExportedNamedExpressionChange} from './CellValue'
import {HyperFormula} from './HyperFormula'
import {Config} from './Config'
import {languages} from './i18n'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Sheets} from './Sheet'
import {
  EvaluationSuspendedError,
  FunctionPluginValidationError,
  InvalidAddressError,
  InvalidArgumentsError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NotAFormulaError,
  NothingToPasteError,
  SheetSizeLimitExceededError,
  SheetNameAlreadyTaken,
  TargetLocationHasMatrixError,
  SourceLocationHasMatrixError,
  NoRelativeAddressesAllowedError,
  MatrixFormulasNotSupportedError,
  NamedExpressionDoesNotExist,
  NamedExpressionNameIsAlreadyTaken,
  NamedExpressionNameIsInvalid
} from './errors'
import * as plugins from './interpreter/plugin'

/** @internal */
class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static NoSheetWithNameError = NoSheetWithNameError
  public static SheetSizeLimitExceededError = SheetSizeLimitExceededError
  public static SheetNameAlreadyTaken = SheetNameAlreadyTaken
  public static InvalidAddressError = InvalidAddressError
  public static DetailedCellError = DetailedCellError
  public static NoOperationToUndoError = NoOperationToUndoError
  public static NoOperationToRedoError = NoOperationToRedoError
  public static NothingToPasteError = NothingToPasteError
  public static LazilyTransformingAstService = LazilyTransformingAstService
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static EvaluationSuspendedError = EvaluationSuspendedError
  public static NotAFormulaError = NotAFormulaError
  public static TargetLocationHasMatrixError = TargetLocationHasMatrixError
  public static SourceLocationHasMatrixError = SourceLocationHasMatrixError
  public static ErrorType = ErrorType
  public static CellError = CellError
  public static InvalidArgumentsError = InvalidArgumentsError
  public static FunctionPluginValidationError = FunctionPluginValidationError
  public static NoRelativeAddressesAllowedError = NoRelativeAddressesAllowedError
  public static MatrixFormulasNotSupportedError = MatrixFormulasNotSupportedError
  public static NamedExpressionDoesNotExist = NamedExpressionDoesNotExist
  public static NamedExpressionNameIsAlreadyTaken = NamedExpressionNameIsAlreadyTaken
  public static NamedExpressionNameIsInvalid = NamedExpressionNameIsInvalid
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
  Sheets,
  HyperFormula,
  NoSheetWithIdError,
  NoSheetWithNameError,
  SheetSizeLimitExceededError,
  InvalidAddressError,
  InvalidArgumentsError,
  NotAFormulaError,
  CellValue,
  NoErrorCellValue,
  CellError,
  DetailedCellError,
  LazilyTransformingAstService,
  ExportedCellChange,
  ExportedNamedExpressionChange,
  NoOperationToUndoError,
  NoOperationToRedoError,
  NothingToPasteError,
  EvaluationSuspendedError,
  FunctionPluginValidationError,
  NoRelativeAddressesAllowedError,
  MatrixFormulasNotSupportedError,
  NamedExpressionDoesNotExist,
  NamedExpressionNameIsAlreadyTaken,
  NamedExpressionNameIsInvalid,
  ErrorType,
  SheetNameAlreadyTaken,
  TargetLocationHasMatrixError,
  SourceLocationHasMatrixError
}
