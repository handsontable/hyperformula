import {Ast, AstNodeType, ProcedureAst, TemplateAst} from "../parser/Ast";
import {cellError, CellValue, ErrorType, CellVertex} from "../Vertex";

export type ExpressionValue = CellValue | CellValue[][]

export class Interpreter {
  private addressMapping: Map<string, CellVertex>

  constructor(addressMapping: Map<string, CellVertex>) {
    this.addressMapping = addressMapping
  }

  public computeFormula(formula: Ast): CellValue {
    const result = this.evaluateAst(formula.ast, formula.addresses)
    if (Array.isArray(result)) {
      return cellError(ErrorType.ARG)
    } else {
      return result as CellValue
    }
  }

  private evaluateAst(ast: TemplateAst, addresses: Array<string>): ExpressionValue {
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
      case AstNodeType.CELL_RANGE: {
        throw Error('CELL_RANGE is not supported yet')
      }
      case AstNodeType.ERROR: {
        return cellError(ErrorType.NAME)
      }
    }
  }

  private evaluateFunction(ast : ProcedureAst, addresses: Array<string>): ExpressionValue {
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
