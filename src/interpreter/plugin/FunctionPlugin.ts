import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {IColumnSearchStrategy} from '../../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../../Config'
import {DependencyGraph} from '../../DependencyGraph'
import {Matrix} from '../../Matrix'
import {Ast, AstNodeType, ProcedureAst} from '../../parser/Ast'
import {Interpreter} from '../Interpreter'

interface IImplementedFunctions {
  [functionName: string]: {
    translationKey: string,
    isVolatile?: boolean,
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
  protected readonly dependencyGraph: DependencyGraph
  protected readonly columnSearch: IColumnSearchStrategy
  protected readonly config: Config

  protected constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.dependencyGraph = interpreter.dependencyGraph
    this.columnSearch = interpreter.columnSearch
    this.config = interpreter.config
  }

  protected evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  protected computeNumericListOfValues(asts: Ast[], formulaAddress: SimpleCellAddress): number[] | CellError {
    const values: number[] = []
    for (const ast of asts) {
      if (ast.type === AstNodeType.CELL_RANGE) {
        for (const cellFromRange of AbsoluteCellRange.fromCellRange(ast, formulaAddress).addresses()) {
          const value = this.dependencyGraph.getCellValue(cellFromRange)
          if (typeof value === 'number') {
            values.push(value)
          } else if (value instanceof CellError) {
            return value
          } else if (typeof value === 'string' || typeof value === 'boolean') {
            return new CellError(ErrorType.NA)
          }
        }
      } else {
        const value = this.evaluateAst(ast, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (value instanceof CellError) {
          return value
        } else if (typeof value === 'string' || typeof value === 'boolean') {
          return new CellError(ErrorType.NA)
        }
      }
    }
    return values
  }

  protected computeListOfValues(asts: Ast[], formulaAddress: SimpleCellAddress): CellValue[] {
    const values: CellValue[] = []
    for (const ast of asts) {
      if (ast.type === AstNodeType.CELL_RANGE) {
        for (const cellFromRange of AbsoluteCellRange.fromCellRange(ast, formulaAddress).addresses()) {
          const value = this.dependencyGraph.getCellValue(cellFromRange)
          values.push(value)
        }
      } else {
        const value = this.evaluateAst(ast, formulaAddress)
        values.push(value)
      }
    }
    return values
  }

  protected computeListOfValuesInRange(range: AbsoluteCellRange): CellValue[] {
    const values: CellValue[] = []
    for (const cellFromRange of range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      values.push(value)
    }

    return values
  }

  protected* generateCellValues(range: AbsoluteCellRange | Matrix): IterableIterator<CellValue> {
    if (range instanceof AbsoluteCellRange) {
      for (const cellFromRange of range.addresses()) {
        yield this.dependencyGraph.getCellValue(cellFromRange)
      }
    } else {
       for (const value of range.generateFlatValues()) {
         yield value
       }
    }
  }
}
