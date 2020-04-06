import { CellError, EmptyValue } from './Cell'
import { CellValue, DetailedCellError, ExportedCellChange, ExportedNamedExpressionChange } from './CellValue'
import {
  InvalidAddressError,
  InvalidArgumentsError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NoOperationToUndo,
  EvaluationSuspendedError,
} from './errors'
import {Sheets} from './GraphBuilder'
import {HyperFormula} from './HyperFormula'
import {Config} from './Config'
import {languages} from './i18n'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'

class HyperFormulaNS extends HyperFormula {
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static InvalidAddressError = InvalidAddressError
  public static EmptyValue = EmptyValue
  public static DetailedCellError = DetailedCellError
  public static NoOperationToUndo = NoOperationToUndo
  public static LazilyTransformingAstService = LazilyTransformingAstService
  public static ExportedCellChange = ExportedCellChange
  public static ExportedNamedExpressionChange = ExportedNamedExpressionChange
  public static EvaluationSuspendedError = EvaluationSuspendedError
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
  CellValue,
  EmptyValue,
  CellError,
  DetailedCellError,
  LazilyTransformingAstService,
  ExportedCellChange,
  ExportedNamedExpressionChange,
  NoOperationToUndo,
  EvaluationSuspendedError,
}
