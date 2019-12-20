import {Sheets} from './GraphBuilder'
import {Config} from './Config'
import {HyperFormula, NoSheetWithIdError, InvalidAddressError} from './HyperFormula'
import {CellValue, EmptyValue, CellError} from './Cell'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'

class HyperFormulaNS extends HyperFormula {
  public static Config = Config
  public static HyperFormula = HyperFormula
  public static NoSheetWithIdError = NoSheetWithIdError
  public static InvalidAddressError = InvalidAddressError
  public static EmptyValue = EmptyValue
  public static CellError = CellError
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
  LazilyTransformingAstService,
}
