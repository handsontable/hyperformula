import {Ast, AstNodeType, ProcedureAst, TemplateAst, CellDependency} from "../parser/Ast";
import {cellError, CellValue, ErrorType, CellVertex, CellAddress} from "../Vertex";
import {generateCellsFromRange} from "../GraphBuilder";

export type ExpressionValue = CellValue | CellValue[][]

export class Interpreter {
  private addressMapping: Map<number, Map<number, CellVertex>>

  constructor(addressMapping: Map<number, Map<number, CellVertex>>) {
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

  private evaluateAst(ast: TemplateAst, addresses: Array<CellDependency>): ExpressionValue {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = addresses[ast.idx] as CellAddress
        const vertex = this.addressMapping.get(address.col)!.get(address.row)!
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
        const [beginRange, endRange] = addresses[ast.idx] as [CellAddress, CellAddress]
        const rangeResult: CellValue[][] = []
        generateCellsFromRange(beginRange, endRange).forEach((rowOfCells) => {
          const rowResult: CellValue[] = []
          rowOfCells.forEach((cellFromRange) => {
            rowResult.push(this.addressMapping.get(cellFromRange.col)!.get(cellFromRange.row)!.getCellValue())
          })
          rangeResult.push(rowResult)
        })
        return rangeResult
      }
      case AstNodeType.ERROR: {
        return cellError(ErrorType.NAME)
      }
    }
  }

  private evaluateFunction(ast : ProcedureAst, addresses: Array<CellDependency>): ExpressionValue {
    switch (ast.procedureName) {
      case "SUM": {
        return ast.args.reduce((currentSum : CellValue, arg) => {
          const value = this.evaluateAst(arg, addresses)
          if (typeof currentSum === 'number' && typeof value === 'number') {
            return currentSum + value
          } else if (typeof currentSum === 'number' && Array.isArray(value)) {
            const flattenRange: Array<CellValue> = [].concat.apply([], value)
            return flattenRange.reduce((acc : CellValue, val: CellValue) => {
              if (typeof acc === 'number' && typeof val === 'number') {
                return acc + val
              } else {
                return cellError(ErrorType.ARG)
              }
            }, currentSum)
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
