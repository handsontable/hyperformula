import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {dateNumberToMonthNumber, dateNumberToYearNumber, dateNumebrToStringFormat, toDateNumber,} from '../Date'
import {Graph} from '../Graph'
import {generateCellsFromRangeGenerator} from '../GraphBuilder'
import {IAddressMapping} from '../IAddressMapping'
import {Ast, AstNodeType, ProcedureAst} from '../parser/Ast'
import {RangeMapping} from '../RangeMapping'
import {EmptyCellVertex, Vertex} from '../Vertex'
import {Functions} from './Functions'
import {SumifModule} from "./Sumif";
import {add} from "./scalar";
import {booleanRepresentation, dateNumberRepresentation} from "./coerce";
import {TextModule} from "./Text";
import {NumericAggregationModule} from "./NumericAggregation";
import {MedianModule} from "./Median";


export class Interpreter {

  private readonly sumifModule: SumifModule
  private readonly textModule: TextModule
  private readonly numericAggregationModule: NumericAggregationModule
  private readonly medianModule: MedianModule

  constructor(
    public readonly addressMapping: IAddressMapping,
    public readonly rangeMapping: RangeMapping,
    public readonly graph: Graph<Vertex>,
    public readonly config: Config,
  ) {
    this.sumifModule = new SumifModule(this)
    this.textModule = new TextModule(this)
    this.numericAggregationModule = new NumericAggregationModule(this)
    this.medianModule = new MedianModule(this)
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = getAbsoluteAddress(ast.reference, formulaAddress)
        const vertex = this.addressMapping.getCell(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.CONCATENATE_OP: {
        return this.textModule.concatenate([ast.left, ast.right], formulaAddress)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (isCellError(leftResult)) {
          return leftResult
        }
        if (isCellError(leftResult)) {
          return rightResult
        }

        if (typeof leftResult !== typeof rightResult) {
          return false
        } else {
          return leftResult === rightResult
        }
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (isCellError(leftResult)) {
          return leftResult
        }
        if (isCellError(leftResult)) {
          return rightResult
        }

        if (typeof leftResult !== typeof rightResult) {
          return true
        } else {
          return leftResult !== rightResult
        }
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult > rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult < rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult >= rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult <= rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
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
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return Math.pow(leftResult, rightResult)
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
      default: {
        throw Error('Not supported Ast node type')
      }
    }
  }

  /**
   * Calculates value of procedure formula based on procedure name
   *
   * @param ast - procedure abstract syntax tree
   * @param formulaAddress - address of the cell in which formula is located
   */
  private evaluateFunction(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    switch (ast.procedureName) {
      case Functions[this.config.language].SUM: {
        return this.numericAggregationModule.sum(ast, formulaAddress)
      }
      case Functions[this.config.language].SUMIF: {
        return this.sumifModule.sumif(ast, formulaAddress)
      }
      case Functions[this.config.language].COUNTIF: {
        return this.sumifModule.countif(ast, formulaAddress)
      }
      case Functions[this.config.language].TRUE: {
        if (ast.args.length > 0) {
          return cellError(ErrorType.NA)
        } else {
          return true
        }
      }
      case Functions[this.config.language].FALSE: {
        if (ast.args.length > 0) {
          return cellError(ErrorType.NA)
        } else {
          return false
        }
      }
      case Functions[this.config.language].ACOS: {
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
      case Functions[this.config.language].IF: {
        const condition = booleanRepresentation(this.evaluateAst(ast.args[0], formulaAddress))
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
      case Functions[this.config.language].AND: {
        if (ast.args.length < 1) {
          return cellError(ErrorType.NA)
        }

        let result: CellValue = true
        let index = 0
        while (result === true && index < ast.args.length) {
          const argValue = this.evaluateAst(ast.args[index], formulaAddress)
          result = booleanRepresentation(argValue)
          ++index
        }
        return result
      }
      case Functions[this.config.language].OR: {
        if (ast.args.length < 1) {
          return cellError(ErrorType.NA)
        }

        let result: CellValue = false
        let index = 0
        while (result === false && index < ast.args.length) {
          const argValue = this.evaluateAst(ast.args[index], formulaAddress)
          result = booleanRepresentation(argValue)
          ++index
        }
        return result
      }
      case Functions[this.config.language].CONCATENATE: {
        return this.textModule.concatenate(ast.args, formulaAddress)
      }
      case Functions[this.config.language].ISERROR: {
        if (ast.args.length != 1) {
          return cellError(ErrorType.NA)
        } else {
          const arg = this.evaluateAst(ast.args[0], formulaAddress)
          return isCellError(arg)
        }
      }
      case Functions[this.config.language].ISBLANK: {
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
      case Functions[this.config.language].COLUMNS: {
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
      case Functions[this.config.language].DATE: {
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
      case Functions[this.config.language].MONTH: {
        if (ast.args.length !== 1) {
          return cellError(ErrorType.NA)
        }

        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

        if (dateNumber !== null) {
          return dateNumberToMonthNumber(dateNumber)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case Functions[this.config.language].YEAR: {
        if (ast.args.length !== 1) {
          return cellError(ErrorType.NA)
        }

        const arg = this.evaluateAst(ast.args[0], formulaAddress)
        const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

        if (dateNumber !== null) {
          return dateNumberToYearNumber(dateNumber)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case Functions[this.config.language].TEXT: {
        if (ast.args.length !== 2) {
          return cellError(ErrorType.NA)
        }

        const dateArg = this.evaluateAst(ast.args[0], formulaAddress)
        const formatArg = this.evaluateAst(ast.args[1], formulaAddress)

        const dateNumber = dateNumberRepresentation(dateArg, this.config.dateFormat)

        if (dateNumber !== null && typeof formatArg === 'string') {
          return dateNumebrToStringFormat(dateNumber, formatArg)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case Functions[this.config.language].SPLIT: {
        const stringArg = ast.args[0]
        const indexArg = ast.args[1]

        const stringToSplit = this.evaluateAst(stringArg, formulaAddress)
        if (typeof stringToSplit !== 'string') {
          return cellError(ErrorType.VALUE)
        }
        const indexToUse = this.evaluateAst(indexArg, formulaAddress)
        if (typeof indexToUse !== 'number') {
          return cellError(ErrorType.VALUE)
        }

        const splittedString = stringToSplit.split(' ')

        if (indexToUse > splittedString.length || indexToUse < 0) {
          return cellError(ErrorType.VALUE)
        }

        return splittedString[indexToUse]
      }
      case Functions[this.config.language].MEDIAN: {
        return this.medianModule.median(ast, formulaAddress)
      }
      default:
        return cellError(ErrorType.NAME)
    }
  }

}