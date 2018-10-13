import {AstNodeType, ProcedureAst, TemplateAst} from "../parser/BetterAst";
import {cellError, CellValue, ErrorType, Vertex} from "../Vertex";

export class Interpreter {
  private addressMapping: Map<string, Vertex>

  constructor(addressMapping: Map<string, Vertex>) {
    this.addressMapping = addressMapping
  }

  public computeFormula(formula: TemplateAst, addresses: Array<string>): CellValue {
    switch (formula.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = addresses[formula.idx]
        const vertex = this.addressMapping.get(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER: {
        return formula.value
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.computeFormula(formula.left, addresses)
        const rightResult = this.computeFormula(formula.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult + rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.computeFormula(formula.left, addresses)
        const rightResult = this.computeFormula(formula.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.computeFormula(formula.left, addresses)
        const rightResult = this.computeFormula(formula.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.computeFormula(formula.left, addresses)
        const rightResult = this.computeFormula(formula.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          if (rightResult == 0) {
            return cellError(ErrorType.DIV_BY_ZERO)
          }
          return leftResult / rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return this.computeFunction(formula, addresses)
      }
    }
  }

  private computeFunction(ast : ProcedureAst, addresses: Array<string>): CellValue {
    switch (ast.procedureName) {
      case "SUM": {
        return ast.args.reduce((currentSum : CellValue, arg) => {
          const value = this.computeFormula(arg, addresses)
          if (typeof currentSum === 'number' && typeof value === 'number') {
            return currentSum + value
          } else {
            return cellError(ErrorType.ARG)
          }
        }, 0)
      }
      default:
        throw Error("Procedure not supported")
    }
  }
}