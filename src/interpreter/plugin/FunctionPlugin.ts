import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {AddressMapping} from '../../AddressMapping'
import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {Config} from '../../Config'
import {Graph} from '../../Graph'
import {Ast, AstNodeType, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {Vertex} from '../../Vertex'
import {Interpreter} from '../Interpreter'
import {Matrix} from "../../Matrix";

interface IImplementedFunctions {
  [functionName: string]: {
    [language: string]: string,
  }
}

export type PluginFunctionType = (ast: ProcedureAst, formulaAddress: SimpleCellAddress) => CellValue

/**
 * Abstract class representing interpreter function plugin.
 * Plugin may contain multiple functions. Each function should be of type {@link PluginFunctionType} and needs to be
 * included in {@link implementedFunctions}
 */
export abstract class FunctionPlugin {
  /**
   * Dictionary containing functions implemented by specific plugin, along with function name translations.
   */
  public static implementedFunctions: IImplementedFunctions
  protected readonly interpreter: Interpreter
  protected readonly addressMapping: AddressMapping
  protected readonly rangeMapping: RangeMapping
  protected readonly graph: Graph<Vertex>
  protected readonly config: Config

  protected constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.addressMapping = interpreter.addressMapping
    this.rangeMapping = interpreter.rangeMapping
    this.graph = interpreter.graph
    this.config = interpreter.config
  }

  protected evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  protected computeNumericListOfValues(asts: Ast[], formulaAddress: SimpleCellAddress): number[] | CellError {
    const values: number[] = []
    for (const ast of asts) {
      if (ast.type === AstNodeType.CELL_RANGE) {
        for (const cellFromRange of AbsoluteCellRange.fromCellRange(ast, formulaAddress).generateCellsFromRangeGenerator()) {
          const value = this.addressMapping.getCellValue(cellFromRange)
          if (typeof value === 'number') {
            values.push(value)
          } else if (value instanceof CellError) {
            return value
          } else {
            return new CellError(ErrorType.NA)
          }
        }
      } else {
        const value = this.evaluateAst(ast, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (value instanceof CellError) {
          return value
        } else {
          return new CellError(ErrorType.NA)
        }
      }
    }
    return values
  }

  protected* generateCellValues(range: AbsoluteCellRange | Matrix): IterableIterator<CellValue> {
    if (range instanceof AbsoluteCellRange) {
      for (const cellFromRange of range.generateCellsFromRangeGenerator()) {
        yield this.addressMapping.getCellValue(cellFromRange)
      }
    } else {
       for (const value of range.generateFlatValues()) {
         yield value
       }
    }
  }
}
