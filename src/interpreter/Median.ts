import {Interpreter} from "./Interpreter";
import {IAddressMapping} from "../IAddressMapping";
import {RangeMapping} from "../RangeMapping";
import {Graph} from "../Graph";
import {Vertex} from "../Vertex";
import {Ast, AstNodeType, ProcedureAst} from "../parser/Ast";
import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from "../Cell";
import {generateCellsFromRangeGenerator} from "../GraphBuilder";

export class MedianModule {
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

  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length === 0) {
      return cellError(ErrorType.NA)
    }

    const values: number[] = []
    for (const astArg of ast.args) {
      if (astArg.type === AstNodeType.CELL_RANGE) {
        const [beginRange, endRange] = [getAbsoluteAddress(astArg.start, formulaAddress), getAbsoluteAddress(astArg.end, formulaAddress)]
        for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
          const value = this.addressMapping.getCell(cellFromRange)!.getCellValue()
          if (typeof value === 'number') {
            values.push(value)
          } else if (isCellError(value)) {
            return value
          } else {
            return cellError(ErrorType.NA)
          }
        }
      } else {
        const value = this.evaluateAst(astArg, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (isCellError(value)) {
          return value
        } else {
          return cellError(ErrorType.NA)
        }
      }
    }

    values.sort((a, b) => (a - b))

    if (values.length % 2 === 0) {
      return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
    } else {
      return values[Math.floor(values.length / 2)]
    }
  }
}