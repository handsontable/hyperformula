import {FunctionPlugin} from "./FunctionPlugin";
import {AstNodeType, ProcedureAst} from "../../parser/Ast";
import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from "../../Cell";
import {EmptyCellVertex} from "../../Vertex";

export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'iserror': {
      'EN': 'ISERROR',
      'PL': 'CZYBLAD',
    },
    'isblank': {
      'EN': 'ISBLANK',
      'PL': 'CZYPUSTA',
    },
    'columns': {
      'EN': 'COLUMNS',
      'PL': 'LICZBAKOLUMN',
    }
  }

  public iserror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length != 1) {
      return cellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)
      return isCellError(arg)
    }
  }

  public isblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length != 1) {
      return cellError(ErrorType.NA)
    }
    const arg = ast.args[0]
    if (arg.type === AstNodeType.CELL_REFERENCE) {
      const address = getAbsoluteAddress(arg.reference, formulaAddress)
      const vertex = this.addressMapping.getCell(address)
      return (vertex === EmptyCellVertex.getSingletonInstance())
    } else {
      return false
    }
  }

  public columns(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return cellError(ErrorType.NA)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.type === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.col - rangeAst.start.col + 1)
    } else {
      return cellError(ErrorType.VALUE)
    }
  }
}