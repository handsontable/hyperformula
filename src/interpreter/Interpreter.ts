import GPU from 'gpu.js'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {
  CellError,
  CellValueTypeOrd,
  EmptyValue,
  ErrorType,
  getCellValueType, InternalCellValue,
  invalidSimpleCellAddress, NoErrorCellValue,
  SimpleCellAddress,
} from '../Cell'
import {ColumnSearchStrategy} from '../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../Config'
import {DateHelper} from '../DateHelper'
import {DependencyGraph} from '../DependencyGraph'
import {Matrix, NotComputedMatrix} from '../Matrix'
import {Maybe} from '../Maybe'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType} from '../parser/Ast'
import {Statistics} from '../statistics/Statistics'
import {
  ArithmeticHelper,
} from './ArithmeticHelper'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
import {divide, multiply, percent, power, unaryminus} from './scalar'
import {concatenate} from './text'
import {NumberLiteralHelper} from '../NumberLiteralHelper'

export class Interpreter {
  private gpu?: GPU.GPU
  private readonly pluginCache: Map<string, [any, string]> = new Map()
  public readonly arithmeticHelper: ArithmeticHelper

  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: ColumnSearchStrategy,
    public readonly config: Config,
    public readonly stats: Statistics,
    public readonly dateHelper: DateHelper,
    public readonly numberLiteralsHelper: NumberLiteralHelper,
  ) {
    this.registerPlugins(this.config.allFunctionPlugins())
    this.arithmeticHelper = new ArithmeticHelper(config, dateHelper, numberLiteralsHelper)
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
        if (invalidSimpleCellAddress(address)) {
          return new CellError(ErrorType.REF)
        }
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
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) === 0
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) !== 0
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) > 0
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) < 0
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) >= 0
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare( leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) <= 0
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.add(
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as NoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as NoErrorCellValue)
          )
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.subtract(
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as NoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as NoErrorCellValue)
          )
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          multiply(
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as NoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as NoErrorCellValue)
          )
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          power(
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as NoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as NoErrorCellValue)
          )
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          divide(
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as NoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as NoErrorCellValue)
          )
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        } else {
          return result
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        } else {
          return unaryminus(this.arithmeticHelper.coerceScalarToNumberOrError(result))
        }
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        } else {
          return percent(this.arithmeticHelper.coerceScalarToNumberOrError(result))
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        const pluginEntry = this.pluginCache.get(ast.procedureName)
        const procedureName = this.config.translationPackage.getFunctionTranslation(ast.procedureName)
        if (pluginEntry && procedureName!==undefined) {
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
      case AstNodeType.ERROR_WITH_RAW_INPUT:
      case AstNodeType.ERROR: {
        return ast.error
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

  private passErrors(left: InterpreterValue, right: InterpreterValue): Maybe<CellError> {
    if (left instanceof CellError) {
      return left
    } else if (left instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else if (right instanceof CellError) {
      return right
    } else if (right instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else {
      return undefined
    }
  }

}
