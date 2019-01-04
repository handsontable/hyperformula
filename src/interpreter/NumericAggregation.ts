import {cellError, CellValue, ErrorType, getAbsoluteAddress, SimpleCellAddress} from "../Cell";
import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from "../parser/Ast";
import {Interpreter, RangeOperation, rangeSum} from "./Interpreter";
import {IAddressMapping} from "../IAddressMapping";
import {RangeMapping} from "../RangeMapping";
import {Graph} from "../Graph";
import {Vertex} from "../Vertex";
import {findSmallerRange, generateCellsFromRangeGenerator} from "../GraphBuilder";

export class NumericAggregationModule {
  private readonly interpreter: Interpreter
  private readonly addressMapping: IAddressMapping
  private readonly rangeMapping: RangeMapping
  private readonly graph: Graph<Vertex>

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.addressMapping = interpreter.addressMapping
    this.rangeMapping = interpreter.rangeMapping
    this.graph = interpreter.graph
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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

  /**
   * Performs range operation on given range
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param functionName - function name to use as cache key
   * @param funcToCalc - range operation
   */
  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: RangeOperation): CellValue {
    const rangeStart = getAbsoluteAddress(ast.start, formulaAddress)
    const rangeEnd = getAbsoluteAddress(ast.end, formulaAddress)
    const rangeVertex = this.rangeMapping.getRange(rangeStart, rangeEnd)

    if (!rangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let value = rangeVertex.getFunctionValue(functionName)
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, ast, formulaAddress)
      value = funcToCalc(rangeValues)
      rangeVertex.setFunctionValue(functionName, value)
    }

    return value
  }

  /**
   * Returns list of values for given range and function name
   *
   * If range is dependent on smaller range, list will contain value of smaller range for this function
   * and values of cells that are not present in smaller range
   *
   * @param functionName - function name (e.g. SUM)
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   */
  private getRangeValues(functionName: string, ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellValue[] {
    const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
    const rangeResult: CellValue[] = []
    const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.rangeMapping, beginRange, endRange)
    const currentRangeVertex = this.rangeMapping.getRange(beginRange, endRange)!
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      rangeResult.push(smallerRangeVertex.getFunctionValue(functionName)!)
    }

    for (const cellFromRange of generateCellsFromRangeGenerator(restRangeStart, restRangeEnd)) {
      rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
    }

    return rangeResult
  }
}