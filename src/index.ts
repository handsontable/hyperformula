/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValue, ErrorType} from './Cell'
import {CellValue, DetailedCellError, ExportedCellChange, ExportedNamedExpressionChange} from './CellValue'
import {HyperFormula} from './HyperFormula'
import {Config} from './Config'
import {languages} from './i18n'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Sheets} from './Sheet'
import {
  EvaluationSuspendedError,
  InvalidAddressError,
  InvalidArgumentsError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NotAFormulaError,
  NothingToPasteError,
  SheetSizeLimitExceededError,
  FunctionPluginValidationError
} from './errors'
import * as plugins from './interpreter/plugin'

/** @internal */
class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static NoSheetWithNameError = NoSheetWithNameError
  public static SheetSizeLimitExceededError = SheetSizeLimitExceededError
  public static InvalidAddressError = InvalidAddressError
  public static EmptyValue = EmptyValue
  public static DetailedCellError = DetailedCellError
  public static NoOperationToUndoError = NoOperationToUndoError
  public static NoOperationToRedoError = NoOperationToRedoError
  public static NothingToPasteError = NothingToPasteError
  public static LazilyTransformingAstService = LazilyTransformingAstService
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static EvaluationSuspendedError = EvaluationSuspendedError
  public static NotAFormulaError = NotAFormulaError
  public static ErrorType = ErrorType
  public static CellError = CellError
  public static InvalidArgumentsError = InvalidArgumentsError
  public static FunctionPluginValidationError = FunctionPluginValidationError
}

const defaultLanguage = Config.defaultConfig.language
HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])

HyperFormula.registerFunctionPlugin(plugins.SumifPlugin)
HyperFormula.registerFunctionPlugin(plugins.TextPlugin)
HyperFormula.registerFunctionPlugin(plugins.NumericAggregationPlugin)
HyperFormula.registerFunctionPlugin(plugins.MedianPlugin)
HyperFormula.registerFunctionPlugin(plugins.DatePlugin)
HyperFormula.registerFunctionPlugin(plugins.BooleanPlugin)
HyperFormula.registerFunctionPlugin(plugins.InformationPlugin)
HyperFormula.registerFunctionPlugin(plugins.TrigonometryPlugin)
HyperFormula.registerFunctionPlugin(plugins.CountUniquePlugin)
HyperFormula.registerFunctionPlugin(plugins.SumprodPlugin)
HyperFormula.registerFunctionPlugin(plugins.MatrixPlugin)
HyperFormula.registerFunctionPlugin(plugins.ExpPlugin)
HyperFormula.registerFunctionPlugin(plugins.AbsPlugin)
HyperFormula.registerFunctionPlugin(plugins.DegreesPlugin)
HyperFormula.registerFunctionPlugin(plugins.RadiansPlugin)
HyperFormula.registerFunctionPlugin(plugins.RandomPlugin)
HyperFormula.registerFunctionPlugin(plugins.VlookupPlugin)
HyperFormula.registerFunctionPlugin(plugins.IsEvenPlugin)
HyperFormula.registerFunctionPlugin(plugins.IsOddPlugin)
HyperFormula.registerFunctionPlugin(plugins.RoundingPlugin)
HyperFormula.registerFunctionPlugin(plugins.RadixConversionPlugin)
HyperFormula.registerFunctionPlugin(plugins.LogarithmPlugin)
HyperFormula.registerFunctionPlugin(plugins.BitwiseLogicOperationsPlugin)
HyperFormula.registerFunctionPlugin(plugins.BitShiftPlugin)
HyperFormula.registerFunctionPlugin(plugins.PowerPlugin)
HyperFormula.registerFunctionPlugin(plugins.MathConstantsPlugin)
HyperFormula.registerFunctionPlugin(plugins.SqrtPlugin)
HyperFormula.registerFunctionPlugin(plugins.ModuloPlugin)
HyperFormula.registerFunctionPlugin(plugins.DeltaPlugin)
HyperFormula.registerFunctionPlugin(plugins.CharPlugin)
HyperFormula.registerFunctionPlugin(plugins.CodePlugin)
HyperFormula.registerFunctionPlugin(plugins.ErrorFunctionPlugin)
HyperFormula.registerFunctionPlugin(plugins.CorrelPlugin)

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
  EmptyValue,
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
  ErrorType,
}
