import { CellError, EmptyValue } from './Cell'
import { CellValue, DetailedCellError } from './CellValue'
import {Config} from './Config'
import {Sheets} from './GraphBuilder'
import {HyperFormula, InvalidAddressError, NoSheetWithIdError} from './HyperFormula'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'

class HyperFormulaNS extends HyperFormula {
  public static Config = Config
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static InvalidAddressError = InvalidAddressError
  public static EmptyValue = EmptyValue
  public static DetailedCellError = DetailedCellError
  public static LazilyTransformingAstService = LazilyTransformingAstService
}

export default HyperFormulaNS

export {
  Sheets,
  Config,
  HyperFormula,
  NoSheetWithIdError,
  InvalidAddressError,
  CellValue,
  EmptyValue,
  CellError,
  DetailedCellError,
  LazilyTransformingAstService,
}
