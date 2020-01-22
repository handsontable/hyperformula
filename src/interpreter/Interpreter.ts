import GPU from 'gpu.js'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {IColumnSearchStrategy} from '../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {Matrix, NotComputedMatrix} from '../Matrix'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, ParsingErrorType} from '../parser/Ast'
import {Statistics} from '../statistics/Statistics'
import {coerceScalarToNumber} from './coerce'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
import {
  add,
  compare,
  divide,
  greater,
  greatereq,
  less, lesseq,
  multiply,
  percent,
  power,
  subtract,
  unaryminus,
  unaryplus
} from './scalar'
import {concatenate} from './text'

export class Interpreter {
  private gpu?: GPU.GPU
  private readonly pluginCache: Map<string, [any, string]> = new Map()

  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: IColumnSearchStrategy,
    public readonly config: Config,
    public readonly stats: Statistics,
  ) {
    this.registerPlugins(this.config.allFunctionPlugins())
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(formulaAddress)
        return this.dependencyGraph.getCellValue(address)
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.CONCATENATE_OP: {
        const left = this.evaluateAst(ast.left, formulaAddress)
        const right = this.evaluateAst(ast.right, formulaAddress)
        return concatenate([left, right])
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
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

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
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

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }

        return compare( leftResult, rightResult, this.config.dateFormat, (arg1, arg2) => {return greater(arg1, arg2, this.config.precisionEpsilon, this.config.ignoreEpsilon)})
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }

        return compare( leftResult, rightResult, this.config.dateFormat, (arg1, arg2) => {return less(arg1, arg2, this.config.precisionEpsilon, this.config.ignoreEpsilon)})

      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }

        return compare( leftResult, rightResult, this.config.dateFormat, (arg1, arg2) => {return greatereq(arg1, arg2, this.config.precisionEpsilon, this.config.ignoreEpsilon)})
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }

        return compare( leftResult, rightResult, this.config.dateFormat, (arg1, arg2) => {return lesseq(arg1, arg2, this.config.precisionEpsilon, this.config.ignoreEpsilon)})
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }

        return add(coerceScalarToNumber(leftResult, this.config.dateFormat), coerceScalarToNumber(rightResult, this.config.dateFormat))
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return subtract(coerceScalarToNumber(leftResult, this.config.dateFormat), coerceScalarToNumber(rightResult, this.config.dateFormat))
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return multiply(coerceScalarToNumber(leftResult, this.config.dateFormat), coerceScalarToNumber(rightResult, this.config.dateFormat))
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return power(coerceScalarToNumber(leftResult, this.config.dateFormat), coerceScalarToNumber(rightResult, this.config.dateFormat))
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (leftResult instanceof CellError) {
          return leftResult
        }
        if(leftResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        if (rightResult instanceof CellError) {
          return rightResult
        }
        if(rightResult instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return divide(coerceScalarToNumber(leftResult, this.config.dateFormat), coerceScalarToNumber(rightResult, this.config.dateFormat))
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return unaryplus(coerceScalarToNumber(result, this.config.dateFormat))
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return unaryminus(coerceScalarToNumber(result, this.config.dateFormat))
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        return percent(coerceScalarToNumber(result, this.config.dateFormat))
      }
      case AstNodeType.FUNCTION_CALL: {
        const pluginEntry = this.pluginCache.get(ast.procedureName)
        if (pluginEntry) {
          const [pluginInstance, pluginFunction] = pluginEntry
          return pluginInstance[pluginFunction](ast, formulaAddress)
        } else {
          return new CellError(ErrorType.NAME)
        }
      }
      case AstNodeType.CELL_RANGE: {
        const range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
        const matrixVertex = this.dependencyGraph.getMatrix(range)
        if (matrixVertex) {
          const matrix = matrixVertex.matrix
          if (matrix instanceof NotComputedMatrix) {
            throw new Error('Matrix should be already computed')
          } else if (matrix instanceof CellError) {
            return matrix
          } else if (matrix instanceof Matrix) {
            return SimpleRangeValue.onlyNumbersDataWithRange(matrix.raw(), matrix.size, range)
          } else {
            throw new Error('Unknown matrix')
          }
        } else {
          return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
        }
      }
      case AstNodeType.PARENTHESIS: {
        return this.evaluateAst(ast.expression, formulaAddress)
      }
      case AstNodeType.ERROR: {
        if (ast.error !== undefined) {
          return ast.error
        }
        /* TODO tidy up parsing errors */
        if (ast.args.length > 0 && ast.args[0].type === ParsingErrorType.StaticOffsetOutOfRangeError) {
          return new CellError(ErrorType.REF)
        }
        return new CellError(ErrorType.NAME)
      }
    }
  }

  public getGpuInstance(): GPU.GPU {
    if (!this.gpu) {
      const GPUConstructor = GPU.GPU || GPU
      this.gpu = new GPUConstructor({mode: this.config.gpuMode })
    }
    return this.gpu
  }

  public destroy() {
    this.pluginCache.clear()
    if (this.gpu) {
      this.gpu.destroy()
    }
  }

  /**
   * Registers plugins with functions to use
   *
   * @param plugins - list of plugin modules
   */
  private registerPlugins(plugins: any[]) {
    for (const pluginClass of plugins) {
      const pluginInstance = new pluginClass(this)
      Object.keys(pluginClass.implementedFunctions).forEach((pluginFunction) => {
        const pluginFunctionData = pluginClass.implementedFunctions[pluginFunction]
        const functionName = pluginFunctionData.translationKey.toUpperCase()
        this.pluginCache.set(functionName, [pluginInstance, pluginFunction])
      })
    }
  }
}
