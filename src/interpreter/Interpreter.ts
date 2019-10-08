import {GPU} from 'gpu.js'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../Cell'
import {IColumnSearchStrategy} from '../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {NotComputedMatrix, Matrix} from '../Matrix'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType} from '../parser/Ast'
import {Statistics} from '../statistics/Statistics'
import {addStrict} from './scalar'
import {concatenate} from './text'
import {SimpleRangeValue, InterpreterValue} from './InterpreterValue'

export class Interpreter {
  public readonly gpu: GPU
  private readonly pluginCache: Map<string, [any, string]> = new Map()

  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: IColumnSearchStrategy,
    public readonly config: Config,
    public readonly stats: Statistics,
  ) {
    this.gpu = new GPU({mode: this.config.gpuMode, format: 'Float'})

    this.registerPlugins(this.config.allFunctionPlugins())
  }

  public evaluateAstToCellValue(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    const interpreterValue = this.evaluateAst(ast, formulaAddress)
    if (interpreterValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else {
      return interpreterValue
    }
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
        if (rightResult instanceof CellError) {
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

        if (leftResult instanceof CellError) {
          return leftResult
        }
        if (rightResult instanceof CellError) {
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

        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult > rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult < rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult >= rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult <= rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (leftResult instanceof Matrix && ast.right.type === AstNodeType.CELL_RANGE) {
          const rightRange = AbsoluteCellRange.fromCellRange(ast.right, formulaAddress)
          const matrixVertex = this.dependencyGraph.getMatrix(rightRange)
          if (matrixVertex === undefined) {
            const resultMatrix: number[][] = []
            let currentRow = 0
            while (currentRow < leftResult.height()) {
              const row: number[] = []
              let currentColumn = 0
              while (currentColumn < leftResult.width()) {
                row.push(addStrict(
                  leftResult.get(currentColumn, currentRow),
                  this.dependencyGraph.getCellValue(rightRange.getAddress(currentColumn, currentRow)),
                ) as number)
                currentColumn++
              }
              resultMatrix.push(row)
              currentRow++
            }
            return new Matrix(resultMatrix)
          } else {
            const matrixValue = matrixVertex.getCellValue()
            if (matrixValue instanceof CellError) {
              return matrixValue
            }
            const kernel = this.gpu.createKernel(function(a: number[][], b: number[][]) {
              return a[this.thread.y as number][this.thread.x as number] + b[this.thread.y as number][this.thread.x as number]
            }).setOutput([matrixVertex.width, matrixVertex.height])

            return new Matrix(kernel(leftResult.raw(), matrixValue.raw()) as number[][])
          }
        }
        if (leftResult instanceof SimpleRangeValue || rightResult instanceof SimpleRangeValue) {
          throw "Cant happen"
        }
        return addStrict(leftResult, rightResult)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return Math.pow(leftResult, rightResult)
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          if (rightResult === 0) {
            return new CellError(ErrorType.DIV_BY_ZERO)
          }
          return leftResult / rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const value = this.evaluateAst(ast.value, formulaAddress)
        if (typeof value === 'number') {
          return -value
        } else {
          return new CellError(ErrorType.VALUE)
        }
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
            throw "Matrix should be computed already"
          }
          return SimpleRangeValue.withData((matrix as Matrix).raw(), (matrix as Matrix).size, range, this.dependencyGraph)
        } else {
          return SimpleRangeValue.fromRange(range, this.dependencyGraph)
        }
      }
      case AstNodeType.ERROR: {
        if (ast.error !== undefined) {
          return ast.error
        }
        if (ast.args[0].type === 'StaticOffsetOutOfRangeError') {
          return new CellError(ErrorType.REF)
        }
        return new CellError(ErrorType.NAME)
      }
      default: {
        throw Error('Not supported Ast node type')
      }
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
        const translatedFunctionName = this.config.getFunctionTranslationFor(pluginFunctionData.translationKey).toUpperCase()
        this.pluginCache.set(translatedFunctionName, [pluginInstance, pluginFunction])
      })
    }
  }
}
