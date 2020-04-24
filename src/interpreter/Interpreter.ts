/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import GPU from 'gpu.js'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, invalidSimpleCellAddress, NoErrorCellValue, SimpleCellAddress} from '../Cell'
import {ColumnSearchStrategy} from '../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {Matrix, NotComputedMatrix} from '../Matrix'
import {Maybe} from '../Maybe'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, RangeOpAst} from '../parser/Ast'
import {Statistics} from '../statistics/Statistics'
import {ArithmeticHelper, divide, multiply, percent, power, unaryminus} from './ArithmeticHelper'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
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
    public readonly dateHelper: DateTimeHelper,
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
      case AstNodeType.EMPTY: {
        throw new Error('Empty argument should not be evaluated.')
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(formulaAddress)
        if (invalidSimpleCellAddress(address)) {
          return new CellError(ErrorType.REF)
        }
        return this.dependencyGraph.getCellValue(address)
      }
      case AstNodeType.ROW_REFERENCE:
      case AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION: {
        throw Error('Shouldnt happen')
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
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) === 0
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) !== 0
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) > 0
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) < 0
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) >= 0
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as NoErrorCellValue, rightResult as NoErrorCellValue) <= 0
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
        if (pluginEntry && this.config.translationPackage.isFunctionTranslated(ast.procedureName)) {
          const [pluginInstance, pluginFunction] = pluginEntry
          return pluginInstance[pluginFunction](ast, formulaAddress)
        } else {
          return new CellError(ErrorType.NAME)
        }
      }
      case AstNodeType.RANGE_OP: {
        if (this.isValidRange(ast)) {
          const range = AbsoluteCellRange.fromAst(ast.left, ast.right, formulaAddress)
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
        } else {
          return new CellError(ErrorType.REF)
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
      this.gpu = new GPUConstructor({mode: this.config.gpuMode})
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

  private isValidRange(ast: RangeOpAst): boolean {
    return ((ast.left.type === AstNodeType.CELL_REFERENCE && ast.right.type === AstNodeType.CELL_REFERENCE) ||
      (ast.left.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION && ast.right.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION) ||
      (ast.left.type === AstNodeType.ROW_REFERENCE && ast.right.type === AstNodeType.ROW_REFERENCE)) &&
      (ast.left.reference?.sheet === ast.right.reference?.sheet)
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
