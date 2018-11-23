import {AddressMapping} from '../AddressMapping'
import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../Cell'
import {dateNumberToMonthNumber, dateNumberToYearNumber, stringToDateNumber, toDateNumber} from '../Date'
import {Graph} from '../Graph'
import {findSmallerRange, generateCellsFromRangeGenerator} from '../GraphBuilder'
import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from '../parser/Ast'
import {Vertex} from '../Vertex'
import {buildCriterionLambda, CriterionLambda, parseCriterion} from './Criterion'
import {split} from '../generatorUtils'

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
      return cellError(ErrorType.VALUE)
    } else {
      return result as CellValue
    }
  }

  private evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
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
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return cellError(ErrorType.VALUE)
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
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const value = this.evaluateAst(ast.value, formulaAddress)
        if (typeof value === 'number') {
          return -value
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return this.evaluateFunction(ast, formulaAddress)
      }
      case AstNodeType.CELL_RANGE: {
        return cellError(ErrorType.VALUE)
      }
      case AstNodeType.ERROR: {
        if (ast.args[0].type === 'StaticOffsetOutOfRangeError') {
          return cellError(ErrorType.REF)
        }
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
      for (const cellFromRange of generateCellsFromRangeGenerator(restRangeStart, restRangeEnd)) {
        rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
      }
    } else {
      for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
        rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
      }
    }
    return rangeResult
  }

  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: RangeOperation): CellValue {
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

  private getPlainRangeValues(ast: CellRangeAst, formulaAddress: SimpleCellAddress) {
    return getPlainRangeValues(this.addressMapping, ast, formulaAddress)
  }

  private evaluateFunction(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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
            return cellError(ErrorType.VALUE)
          }
        }, 0)
      }
      case 'SUMIF': {
        let conditionValues
        const conditionRangeArg = ast.args[0]
        if (conditionRangeArg.type === AstNodeType.CELL_RANGE) {
          conditionValues = this.getPlainRangeValues(conditionRangeArg, formulaAddress)
        } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE) {
          conditionValues = [this.evaluateAst(conditionRangeArg, formulaAddress)][Symbol.iterator]()
        } else {
          return cellError(ErrorType.VALUE)
        }

        const criterionString = this.evaluateAst(ast.args[1], formulaAddress)
        if (typeof criterionString !== 'string') {
          return cellError(ErrorType.VALUE)
        }

        let computableValues
        const valuesRangeArg = ast.args[2]
        if (valuesRangeArg.type === AstNodeType.CELL_RANGE) {
          computableValues = this.getPlainRangeValues(valuesRangeArg, formulaAddress)
        } else if (valuesRangeArg.type === AstNodeType.CELL_REFERENCE) {
          computableValues = [this.evaluateAst(valuesRangeArg, formulaAddress)][Symbol.iterator]()
        } else {
          return cellError(ErrorType.VALUE)
        }

        const criterion = parseCriterion(criterionString)
        if (criterion === null) {
          return cellError(ErrorType.VALUE)
        }

        const criterionLambda = buildCriterionLambda(criterion)
        const filteredValues = ifFilter(criterionLambda, conditionValues, computableValues)
        return reduceSum(filteredValues)
      }
      case 'COUNTIF': {
        const conditionRangeArg = ast.args[0]
        if (conditionRangeArg.type !== AstNodeType.CELL_RANGE) {
          return cellError(ErrorType.VALUE)
        }

        const conditionValues = this.getPlainRangeValues(conditionRangeArg, formulaAddress)
        const criterionString = this.evaluateAst(ast.args[1], formulaAddress)
        if (typeof criterionString !== 'string') {
          return cellError(ErrorType.VALUE)
        }

        const criterion = parseCriterion(criterionString)
        if (criterion === null) {
          return cellError(ErrorType.VALUE)
        }

        const criterionLambda = buildCriterionLambda(criterion)
        let counter = 0
        for (const e of conditionValues) {
          if (criterionLambda(e)) {
            counter++
          }
        }
        return counter
      }
      case 'TRUE': {
        if (ast.args.length > 0) {
          return cellError(ErrorType.NA)
        } else {
          return true
        }
      }
      case 'FALSE': {
        if (ast.args.length > 0) {
          return cellError(ErrorType.NA)
        } else {
          return false
        }
      }
      case 'ACOS': {
        if (ast.args.length !== 1) {
          return cellError(ErrorType.NA)
        }

        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        if (typeof arg !== 'number') {
          return cellError(ErrorType.VALUE)
        } else if (-1 <= arg && arg <= 1) {
          return Math.acos(arg)
        } else {
          return cellError(ErrorType.NUM)
        }
      }
      case 'IF': {
        const condition = this.booleanRepresentation(this.evaluateAst(ast.args[0], formulaAddress))
        if (condition === true) {
          return this.evaluateAst(ast.args[1], formulaAddress)
        } else if (condition === false) {
          if (ast.args[2]) {
            return this.evaluateAst(ast.args[2], formulaAddress)
          } else {
            return false
          }
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case 'AND': {
        if (ast.args.length < 1) {
          return cellError(ErrorType.NA)
        }

        let result: CellValue = true
        let index = 0
        while (result === true && index < ast.args.length) {
          const argValue = this.evaluateAst(ast.args[index], formulaAddress)
          result = this.booleanRepresentation(argValue)
          ++index
        }
        return result
      }
      case 'OR': {
        if (ast.args.length < 1) {
          return cellError(ErrorType.NA)
        }

        let result: CellValue = false
        let index = 0
        while (result === false && index < ast.args.length) {
          const argValue = this.evaluateAst(ast.args[index], formulaAddress)
          result = this.booleanRepresentation(argValue)
          ++index
        }
        return result
      }
      case 'CONCATENATE': {
        return ast.args.reduce((acc: CellValue, arg: Ast) => {
          const argResult = this.evaluateAst(arg, formulaAddress)
          if (typeof acc === 'string' && typeof argResult === 'string') {
            return acc.concat(argResult)
          } else {
            return cellError(ErrorType.VALUE)
          }
        }, '')
      }
      case 'ISERROR': {
        if (ast.args.length != 1) {
          return cellError(ErrorType.NA)
        } else {
          const arg = this.evaluateAst(ast.args[0], formulaAddress)
          return isCellError(arg)
        }
      }
      case 'COLUMNS': {
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
      case 'DATE': {
        if (ast.args.length !== 3) {
          return cellError(ErrorType.NA)
        }

        const year = this.evaluateAst(ast.args[0], formulaAddress)
        const month = this.evaluateAst(ast.args[1], formulaAddress)
        const day = this.evaluateAst(ast.args[2], formulaAddress)

        if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
          return cellError(ErrorType.VALUE)
        }

        return toDateNumber(year, month, day)
      }
      case 'MONTH': {
        if (ast.args.length !== 1) {
          return cellError(ErrorType.NA)
        }

        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        const dateNumber = this.dateNumberRepresentation(arg)

        if (dateNumber !== null) {
          return dateNumberToMonthNumber(dateNumber)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case 'YEAR': {
        if (ast.args.length !== 1) {
          return cellError(ErrorType.NA)
        }

        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        const dateNumber = this.dateNumberRepresentation(arg)

        if (dateNumber !== null) {
          return dateNumberToYearNumber(dateNumber)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      default:
        return cellError(ErrorType.NAME)
    }
  }

  private dateNumberRepresentation(arg: CellValue): number | null {
    if (typeof arg === 'number') {
      return arg
    } else if (typeof arg === 'string') {
      return stringToDateNumber(arg)
    } else {
      return null
    }
  }

  private booleanRepresentation(arg: CellValue): CellValue {
    if (typeof arg === 'number') {
      return arg !== 0
    } else if (typeof arg === 'boolean') {
      return arg
    } else {
      return cellError(ErrorType.VALUE)
    }
  }

}

export type RangeOperation = (rangeValues: CellValue[]) => CellValue

export function rangeSum(rangeValues: CellValue[]): CellValue {
  return rangeValues.reduce((acc: CellValue, val: CellValue) => {
    if (typeof acc === 'number' && typeof val === 'number') {
      return acc + val
    } else {
      return cellError(ErrorType.VALUE)
    }
  })
}

function * getPlainRangeValues(addressMapping: AddressMapping, ast: CellRangeAst, formulaAddress: SimpleCellAddress): IterableIterator<CellValue> {
  const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
  for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
    yield addressMapping.getCell(cellFromRange)!.getCellValue()
  }
}

function * ifFilter(criterionLambda: CriterionLambda, conditionalIterable: IterableIterator<CellValue>, computableIterable: IterableIterator<CellValue>): IterableIterator<CellValue> {
  const conditionalSplit = split(conditionalIterable)
  const computableSplit = split(computableIterable)
  if (conditionalSplit.hasOwnProperty('value') && computableSplit.hasOwnProperty('value')) {
    const conditionalFirst = conditionalSplit.value as CellValue
    const computableFirst = computableSplit.value as CellValue
    if (criterionLambda(conditionalFirst)) {
      yield computableFirst
    }

    yield * ifFilter(criterionLambda, conditionalSplit.rest, computableSplit.rest)
  }
}

function reduceSum(iterable: IterableIterator<CellValue>): CellValue {
  let acc = 0
  for (const val of iterable) {
    if (typeof acc === 'number' && typeof val === 'number') {
      acc += val
    } else {
      return cellError(ErrorType.VALUE)
    }
  }
  return acc
}
