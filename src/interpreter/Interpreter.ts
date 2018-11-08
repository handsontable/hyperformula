import {AddressMapping} from '../AddressMapping'
import {cellError, CellValue, ErrorType, getAbsoluteAddress, SimpleCellAddress} from '../Cell'
import {Graph} from '../Graph'
import {findSmallerRange, generateCellsFromRange} from '../GraphBuilder'
import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from '../parser/Ast'
import {Vertex} from '../Vertex'

export type ExpressionValue = CellValue | CellValue[][]

export class Interpreter {
  private addressMapping: AddressMapping
  private graph: Graph<Vertex>

  constructor(addressMapping: AddressMapping, graph: Graph<Vertex>) {
    this.addressMapping = addressMapping
    this.graph = graph
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
      case AstNodeType.MINUS_UNARY_OP: {
        const value = this.evaluateAst(ast.value, formulaAddress)
        if (typeof value === 'number') {
          return -value
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

  private getRangeValues(functionName: string, ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellValue[] {
    const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
    const rangeResult: CellValue[] = []
    const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.addressMapping, beginRange, endRange)
    const currentRangeVertex = this.addressMapping.getRange(beginRange, endRange)!
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      rangeResult.push(smallerRangeVertex.getRangeValue(functionName)!)
      generateCellsFromRange(restRangeStart, restRangeEnd).forEach((rowOfCells) => {
        rowOfCells.forEach((cellFromRange) => {
          rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
        })
      })
    } else {
      generateCellsFromRange(beginRange, endRange).forEach((rowOfCells) => {
        rowOfCells.forEach((cellFromRange) => {
          rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
        })
      })
    }
    return rangeResult
  }

  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: RangeOperation): ExpressionValue {
    const rangeStart = getAbsoluteAddress(ast.start, formulaAddress)
    const rangeEnd = getAbsoluteAddress(ast.end, formulaAddress)
    const rangeVertex = this.addressMapping.getRange(rangeStart, rangeEnd)

    if (!rangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let value = rangeVertex.getRangeValue(functionName)
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, ast, formulaAddress)
      value = funcToCalc(rangeValues)
      rangeVertex.setRangeValue(functionName, value)
    }

    return value
  }

  private evaluateFunction(ast: ProcedureAst, formulaAddress: SimpleCellAddress): ExpressionValue {
    switch (ast.procedureName) {
      case 'SUM': {
        return ast.args.reduce((currentSum: CellValue, arg) => {
          let value
          if (arg.type === AstNodeType.CELL_RANGE) {
            value = this.evaluateRange(arg, formulaAddress, 'SUM', rangeSum)
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
      case "TRUE": {
        return true
      }
      case "FALSE": {
        return false
      }
      case "ACOS": {
        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        if (typeof arg === 'number' && -1 <= arg && arg <= 1) {
          return Math.acos(arg);
        } else {
          return cellError(ErrorType.NUM)
        }
      }
      default:
        return cellError(ErrorType.NAME)
    }
  }
}

export type RangeOperation = (rangeValues: CellValue[]) => CellValue

export function rangeSum(rangeValues: CellValue[]): CellValue {
  return rangeValues.reduce((acc: CellValue, val: CellValue) => {
    if (typeof acc === 'number' && typeof val === 'number') {
      return acc + val
    } else {
      return cellError(ErrorType.ARG)
    }
  })
}
