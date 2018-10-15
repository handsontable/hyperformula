import {Ast, AstNodeType, ProcedureAst, TemplateAst} from "../parser/Ast";
import {cellError, CellValue, ErrorType, Vertex} from "../Vertex";

export class Interpreter {
  private addressMapping: Map<string, Vertex>

  constructor(addressMapping: Map<string, Vertex>) {
    this.addressMapping = addressMapping
  }

  public computeFormula(formula: Ast): CellValue {
    return this.evaluateAst(formula.ast, formula.addresses)
  }

  private evaluateAst(ast: TemplateAst, addresses: Array<string>): CellValue {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = addresses[ast.idx]
        const vertex = this.addressMapping.get(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER: {
        return ast.value
      }
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, addresses)
        const rightResult = this.evaluateAst(ast.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult + rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, addresses)
        const rightResult = this.evaluateAst(ast.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, addresses)
        const rightResult = this.evaluateAst(ast.right, addresses)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, addresses)
        const rightResult = this.evaluateAst(ast.right, addresses)
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
        return this.evaluateFunction(ast, addresses)
      }
    }
  }

  private evaluateFunction(ast : ProcedureAst, addresses: Array<string>): CellValue {
    switch (ast.procedureName) {
      case "SUM": {
        return ast.args.reduce((currentSum : CellValue, arg) => {
          const value = this.evaluateAst(arg, addresses)
          if (typeof currentSum === 'number' && typeof value === 'number') {
            return currentSum + value
          } else {
            return cellError(ErrorType.ARG)
          }
        }, 0)
      }
      default:
        return cellError(ErrorType.NAME)
    }
  }
}
