import {cellError, CellError, cellRangeToSimpleCellRange, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress, SimpleCellRange} from '../../Cell'
import {Config} from '../../Config'
import {Graph} from '../../Graph'
import {generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {IAddressMapping} from '../../IAddressMapping'
import {Ast, AstNodeType, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {Vertex} from '../../Vertex'
import {Interpreter} from '../Interpreter'

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
  protected readonly addressMapping: IAddressMapping
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
        for (const cellFromRange of generateCellsFromRangeGenerator(cellRangeToSimpleCellRange(ast, formulaAddress))) {
          const value = this.addressMapping.getCellValue(cellFromRange)
          if (typeof value === 'number') {
            values.push(value)
          } else if (isCellError(value)) {
            return value
          } else {
            return cellError(ErrorType.NA)
          }
        }
      } else {
        const value = this.evaluateAst(ast, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (isCellError(value)) {
          return value
        } else {
          return cellError(ErrorType.NA)
        }
      }
    }
    return values
  }

  protected getCellValuesFromRange(range: SimpleCellRange): CellValue[] {
    const result = []
    for (const cellFromRange of generateCellsFromRangeGenerator(range)) {
      result.push(this.addressMapping.getCell(cellFromRange).getCellValue())
    }
    return result
  }
}
