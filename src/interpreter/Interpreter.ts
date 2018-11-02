import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from "../parser/Ast";
import {cellError, CellValue, ErrorType, getAbsoluteAddress, SimpleCellAddress} from "../Cell";
import {generateCellsFromRange} from "../GraphBuilder";
import {AddressMapping} from "../AddressMapping"

export type ExpressionValue = CellValue | CellValue[][]

export class Interpreter {
  private addressMapping: AddressMapping

  constructor(addressMapping: AddressMapping) {
    this.addressMapping = addressMapping
  }

  public computeFormula(formula: Ast, formulaAddress: SimpleCellAddress): CellValue {
    const result = this.evaluateAst(formula, formulaAddress)
    if (Array.isArray(result)) {
      return cellError(ErrorType.ARG)
    } else {
      return result as CellValue
    }
  }

  private evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): ExpressionValue {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = getAbsoluteAddress(ast.reference, formulaAddress)
        const vertex = this.addressMapping.getCell(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER: {
        return ast.value
      }
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult + rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return cellError(ErrorType.ARG)
        }
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
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
        return this.evaluateFunction(ast, formulaAddress)
      }
      case AstNodeType.CELL_RANGE: {
        return cellError(ErrorType.VALUE)
      }
      case AstNodeType.ERROR: {
        return cellError(ErrorType.NAME)
      }
    }
  }

  private getRangeValues(ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellValue[][] {
    const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
    const rangeResult: CellValue[][] = []
    generateCellsFromRange(beginRange, endRange).forEach((rowOfCells) => {
      const rowResult: CellValue[] = []
      rowOfCells.forEach((cellFromRange) => {
        rowResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
      })
      rangeResult.push(rowResult)
    })
    return rangeResult
  }

  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: RangeOperation): ExpressionValue {
    const rangeStart = getAbsoluteAddress(ast.start, formulaAddress)
    const rangeEnd = getAbsoluteAddress(ast.end, formulaAddress)
    const rangeVertex = this.addressMapping.getRange(rangeStart, rangeEnd)

    if (!rangeVertex) {
      throw Error("Range does not exists in graph")
    }

    let value = rangeVertex.getRangeValue(functionName)
    if (!value) {
      value = funcToCalc(this.getRangeValues(ast, formulaAddress) as CellValue[][])
      rangeVertex.setCellValue(functionName, value)
    }

    return value
  }

  private evaluateFunction(ast: ProcedureAst, formulaAddress: SimpleCellAddress): ExpressionValue {
    switch (ast.procedureName) {
      case "SUM": {
        return ast.args.reduce((currentSum: CellValue, arg) => {
          let value
          if (arg.type === AstNodeType.CELL_RANGE) {
            value = this.evaluateRange(arg, formulaAddress, "SUM", rangeSum)
          } else {
            value = this.evaluateAst(arg, formulaAddress)
          }

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

export type RangeOperation = (rangeValues: CellValue[][]) => CellValue

export function rangeSum(rangeValues: CellValue[][]): CellValue {
  const flattenRange: Array<CellValue> = [].concat.apply([], rangeValues)
  return flattenRange.reduce((acc: CellValue, val: CellValue) => {
    if (typeof acc === 'number' && typeof val === 'number') {
      return acc + val
    } else {
      return cellError(ErrorType.ARG)
    }
  })
}
