/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import { CellError, EmptyValue, ErrorType } from './Cell'
import { CellValue, DetailedCellError, ExportedCellChange, ExportedNamedExpressionChange } from './CellValue'
import {
  InvalidAddressError,
  InvalidArgumentsError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NoOperationToUndoError,
  NoOperationToRedoError,
  EvaluationSuspendedError,
  NotAFormulaError
} from './errors'
import {Sheets} from './GraphBuilder'
import {HyperFormula} from './HyperFormula'
import {Config} from './Config'
import {languages} from './i18n'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'

/** @internal */
class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static InvalidAddressError = InvalidAddressError
  public static EmptyValue = EmptyValue
  public static DetailedCellError = DetailedCellError
  public static NoOperationToUndoError = NoOperationToUndoError
  public static NoOperationToRedoError = NoOperationToRedoError
  public static LazilyTransformingAstService = LazilyTransformingAstService
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static EvaluationSuspendedError = EvaluationSuspendedError
  public static NotAFormulaError = NotAFormulaError
  public static ErrorType = ErrorType
  public static CellError = CellError
  public static InvalidArgumentsError = InvalidArgumentsError
}

const defaultLanguage = Config.defaultConfig.language
HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])

export default HyperFormulaNS

export {
  Sheets,
  HyperFormula,
  NoSheetWithIdError,
  InvalidAddressError,
  InvalidArgumentsError,
  NoSheetWithNameError,
  NotAFormulaError,
  CellValue,
  EmptyValue,
  CellError,
  DetailedCellError,
  LazilyTransformingAstService,
  ExportedCellChange,
  ExportedNamedExpressionChange,
  NoOperationToUndoError,
  NoOperationToRedoError,
  EvaluationSuspendedError,
  ErrorType
}
