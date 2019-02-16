import {CellError, cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {Graph} from '../Graph'
import {IAddressMapping} from '../IAddressMapping'
import {Ast, AstNodeType} from '../parser/Ast'
import {RangeMapping} from '../RangeMapping'
import {Vertex} from '../Vertex'
// import {BooleanPlugin} from './plugin/BooleanPlugin'
// import {CountUniquePlugin} from './plugin/CountUniquePlugin'
// import {DatePlugin} from './plugin/DatePlugin'
// import {InformationPlugin} from './plugin/InformationPlugin'
import {MedianPlugin} from './plugin/MedianPlugin'
import {NumericAggregationPlugin} from './plugin/NumericAggregationPlugin'
// import {SumifPlugin} from './plugin/SumifPlugin'
// import {SumprodPlugin} from './plugin/SumprodPlugin'
// import {TextPlugin} from './plugin/TextPlugin'
// import {TrigonometryPlugin} from './plugin/TrigonometryPlugin'
import {addStrict} from './scalar'
import {concatenate} from './text'

export class Interpreter {
  private readonly pluginCache: Map<string, [any, string]> = new Map()
  public timeSpentOnMedian = 0

  constructor(
      public readonly addressMapping: IAddressMapping,
      public readonly rangeMapping: RangeMapping,
      public readonly graph: Graph<Vertex>,
      public readonly config: Config,
  ) {
    this.registerPlugins([
        NumericAggregationPlugin, MedianPlugin,
      // SumifPlugin, TextPlugin, NumericAggregationPlugin, MedianPlugin, DatePlugin, BooleanPlugin, InformationPlugin, TrigonometryPlugin, CountUniquePlugin,
    ])

    this.registerPlugins(this.config.functionPlugins)
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public async evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): Promise<CellValue> {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const address = getAbsoluteAddress(ast.reference, formulaAddress)
        const value = await this.addressMapping.getCellValue(address)
        if (value === 2) {
          // await new Promise(r => setTimeout(r, 2000))
          return value
        } else {
          return value
        }
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.CONCATENATE_OP: {
        const left = await this.evaluateAst(ast.left, formulaAddress)
        const right = await this.evaluateAst(ast.right, formulaAddress)
        return concatenate([left, right])
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (isCellError(leftResult)) {
          return leftResult
        }
        if (isCellError(rightResult)) {
          return rightResult
        }

        if (typeof leftResult !== typeof rightResult) {
          return false
        } else {
          return leftResult === rightResult
        }
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (isCellError(leftResult)) {
          return leftResult
        }
        if (isCellError(rightResult)) {
          return rightResult
        }

        if (typeof leftResult !== typeof rightResult) {
          return true
        } else {
          return leftResult !== rightResult
        }
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult > rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult < rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult >= rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)

        if (typeof leftResult === typeof rightResult && typeof leftResult === 'number') {
          return leftResult <= rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)
        return addStrict(leftResult, rightResult)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.POWER_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return Math.pow(leftResult, rightResult)
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.DIV_OP: {
        const leftResult = await this.evaluateAst(ast.left, formulaAddress)
        const rightResult = await this.evaluateAst(ast.right, formulaAddress)
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
        const value = await this.evaluateAst(ast.value, formulaAddress)
        if (typeof value === 'number') {
          return -value
        } else {
          return cellError(ErrorType.VALUE)
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        const pluginEntry = this.pluginCache.get(ast.procedureName)
        if (pluginEntry) {
          const [pluginInstance, pluginFunction] = pluginEntry
          if (ast.procedureName === 'MEDIAN') {
            const startedAt = Date.now()
            const result = await pluginInstance[pluginFunction](ast, formulaAddress)
            const finishedAt = Date.now()
            this.timeSpentOnMedian += (finishedAt - startedAt)
            return result
          } else {
            return await pluginInstance[pluginFunction](ast, formulaAddress)
          }
        } else {
          return cellError(ErrorType.NAME)
        }
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
