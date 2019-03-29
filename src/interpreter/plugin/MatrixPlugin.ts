import {FunctionPlugin} from './FunctionPlugin'
import {ProcedureAst} from "../../parser/Ast";
import {CellValue, Matrix, SimpleCellAddress} from "../../Cell";

export class MatrixPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    countunique: {
      EN: 'MMULT',
      PL: 'MACIERZ.ILOCZYN',
    },
  }

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return []
  }
}
