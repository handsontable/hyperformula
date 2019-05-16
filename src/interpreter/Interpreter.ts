import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {AddressMapping} from '../AddressMapping'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../Cell'
import {CellAddress} from '../CellAddress'
import {Config} from '../Config'
import {Graph} from '../Graph'
import {Matrix} from '../Matrix'
import {Ast, AstNodeType} from '../parser/Ast'
import {RangeMapping} from '../RangeMapping'
import {Vertex} from '../Vertex'
import {BooleanPlugin} from './plugin/BooleanPlugin'
import {CountUniquePlugin} from './plugin/CountUniquePlugin'
import {DatePlugin} from './plugin/DatePlugin'
import {ExpPlugin} from './plugin/ExpPlugin'
import {InformationPlugin} from './plugin/InformationPlugin'
import {MatrixPlugin} from './plugin/MatrixPlugin'
import {MedianPlugin} from './plugin/MedianPlugin'
import {NumericAggregationPlugin} from './plugin/NumericAggregationPlugin'
import {SumifPlugin} from './plugin/SumifPlugin'
import {SumprodPlugin} from './plugin/SumprodPlugin'
import {TextPlugin} from './plugin/TextPlugin'
import {TrigonometryPlugin} from './plugin/TrigonometryPlugin'
import {addStrict} from './scalar'
import {concatenate} from './text'
import {GPU} from 'gpu.js'

export class Interpreter {
  private readonly pluginCache: Map<string, [any, string]> = new Map()

  constructor(
    public readonly addressMapping: AddressMapping,
    public readonly rangeMapping: RangeMapping,
    public readonly graph: Graph<Vertex>,
    public readonly config: Config,
  ) {
    this.registerPlugins([
      SumifPlugin, TextPlugin, NumericAggregationPlugin, MedianPlugin, DatePlugin, BooleanPlugin, InformationPlugin, TrigonometryPlugin, CountUniquePlugin, SumprodPlugin, MatrixPlugin, ExpPlugin,
    ])

    this.registerPlugins(this.config.functionPlugins)
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
        const reference = new CellAddress(ast.reference.sheet, ast.reference.col, ast.reference.row, ast.reference.type)
        const address = reference.toSimpleCellAddress(formulaAddress)
        return this.addressMapping.getCellValue(address)
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

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult > rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult < rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult >= rightResult
        } else {
          return new CellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
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
          const matrixVertex = this.addressMapping.getMatrix(rightRange)
          if (matrixVertex === undefined) {
            const resultMatrix: number[][] = []
            let currentRow = 0
            while (currentRow < leftResult.height()) {
              const row: number[] = []
              let currentColumn = 0
              while (currentColumn < leftResult.width()) {
                row.push(addStrict(
                  leftResult.get(currentColumn, currentRow),
                  this.addressMapping.getCellValue(rightRange.getAddress(currentColumn, currentRow)),
                ) as number)
                currentColumn++
              }
              resultMatrix.push(row)
              currentRow++
            }
            return new Matrix(resultMatrix)
          } else {
            const matrixValue = matrixVertex.getCellValue()
            const gpu = new GPU({mode: this.config.gpuMode, format: 'Float'})
            const kernel = gpu.createKernel(function(a: number[][], b: number[][]) {
              return a[this.thread.y as number][this.thread.x as number] + b[this.thread.y as number][this.thread.x as number]
            }).setOutput([matrixVertex.width, matrixVertex.height])

            return new Matrix(kernel(leftResult.raw(), matrixValue.raw()) as number[][])
          }
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
          if (rightResult == 0) {
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
        return new CellError(ErrorType.VALUE)
      }
      case AstNodeType.ERROR: {
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
        const functionName = pluginClass.implementedFunctions[pluginFunction][this.config.language].toUpperCase()
        this.pluginCache.set(functionName, [pluginInstance, pluginFunction])
      })
    }
  }
}
