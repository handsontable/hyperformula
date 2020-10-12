/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import GPU from 'gpu.js'
import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'
import {
  CellError,
  EmptyValue,
  ErrorType,
  InternalNoErrorCellValue,
  invalidSimpleCellAddress,
  SimpleCellAddress
} from '../Cell'
import {ColumnSearchStrategy} from '../Lookup/SearchStrategy'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {ErrorMessage} from '../error-message'
import {Matrix, NotComputedMatrix} from '../Matrix'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, CellRangeAst, ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {Serialization} from '../Serialization'
import {Statistics} from '../statistics/Statistics'
import {ArithmeticHelper, coerceScalarToString, divide, fixNegativeZero, isNumberOverflow} from './ArithmeticHelper'
import {CriterionBuilder} from './Criterion'
import {FunctionRegistry} from './FunctionRegistry'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'

export class Interpreter {
  private gpu?: GPU.GPU
  public readonly arithmeticHelper: ArithmeticHelper
  public readonly criterionBuilder: CriterionBuilder

  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: ColumnSearchStrategy,
    public readonly config: Config,
    public readonly stats: Statistics,
    public readonly dateHelper: DateTimeHelper,
    public readonly numberLiteralsHelper: NumberLiteralHelper,
    public readonly functionRegistry: FunctionRegistry,
    public readonly namedExpressions: NamedExpressions,
    public readonly serialization: Serialization
  ) {
    this.functionRegistry.initializePlugins(this)
    this.arithmeticHelper = new ArithmeticHelper(config, dateHelper, numberLiteralsHelper)
    this.criterionBuilder = new CriterionBuilder(config)
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    let val = this.evaluateAstWithoutPostoprocessing(ast, formulaAddress)
    if (typeof val === 'number') {
      if (isNumberOverflow(val)) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      } else {
        val = fixNegativeZero(val)
      }
    }
    return wrapperForAddress(val, formulaAddress)
  }
  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  private evaluateAstWithoutPostoprocessing(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return EmptyValue
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(formulaAddress)
        if (invalidSimpleCellAddress(address)) {
          return new CellError(ErrorType.REF, ErrorMessage.BadRef)
        }
        return this.dependencyGraph.getCellValue(address)
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast.value
      }
      case AstNodeType.CONCATENATE_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary((a, b) => a.concat(b),
            coerceScalarToString(leftResult as InternalNoErrorCellValue),
            coerceScalarToString(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) === 0
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) !== 0
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) > 0
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) < 0
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) >= 0
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) <= 0
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary(this.arithmeticHelper.addWithEpsilon,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary(this.arithmeticHelper.subtract,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary(
            (a, b) => a*b,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary(
            Math.pow,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return passErrors(leftResult, rightResult) ??
          wrapperBinary(
            divide,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          )
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
        } else {
          return result
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
        } else {
          return wrapperUnary((a) => -a,
            this.arithmeticHelper.coerceScalarToNumberOrError(result))
        }
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
        } else {
          return wrapperUnary((a) => a/100,
            this.arithmeticHelper.coerceScalarToNumberOrError(result))
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        if(this.config.licenseKeyValidityState !== LicenseKeyValidityState.VALID && !FunctionRegistry.functionIsProtected(ast.procedureName)) {
          return new CellError(ErrorType.LIC, ErrorMessage.LicenseKey(this.config.licenseKeyValidityState))
        }
        const pluginEntry = this.functionRegistry.getFunction(ast.procedureName)
        if (pluginEntry && this.config.translationPackage.isFunctionTranslated(ast.procedureName)) {
          const [pluginFunction, pluginInstance] = pluginEntry as [string, any]
          return pluginInstance[pluginFunction](ast, formulaAddress)
        } else {
          return new CellError(ErrorType.NAME, ErrorMessage.FunctionName(ast.procedureName))
        }
      }
      case AstNodeType.NAMED_EXPRESSION: {
        const namedExpression = this.namedExpressions.nearestNamedExpression(ast.expressionName, formulaAddress.sheet)
        if (namedExpression) {
          return this.dependencyGraph.getCellValue(namedExpression.address)
        } else {
          return new CellError(ErrorType.NAME, ErrorMessage.NamedExpressionName(ast.expressionName))
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
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
      case AstNodeType.COLUMN_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
        const range = AbsoluteColumnRange.fromColumnRange(ast, formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.ROW_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
        const range = AbsoluteRowRange.fromRowRange(ast, formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
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
    if (this.gpu) {
      this.gpu.destroy()
    }
  }

  private rangeSpansOneSheet(ast: CellRangeAst | ColumnRangeAst | RowRangeAst): boolean {
    return ast.start.sheet === ast.end.sheet
  }
}

function passErrors(left: InterpreterValue, right: InterpreterValue): Maybe<CellError> {
  if (left instanceof CellError) {
    return left
  } else if (left instanceof SimpleRangeValue) {
    return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
  } else if (right instanceof CellError) {
    return right
  } else if (right instanceof SimpleRangeValue) {
    return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
  } else {
    return undefined
  }
}

function wrapperUnary<T extends InterpreterValue>(op: (a: T) => InterpreterValue, a: T | CellError): InterpreterValue {
  if(a instanceof CellError) {
    return a
  } else {
    return op(a)
  }
}

function wrapperBinary<T extends InterpreterValue>(op: (a: T, b: T) => InterpreterValue, a: T | CellError, b: T | CellError): InterpreterValue {
  if(a instanceof CellError) {
    return a
  } else if(b instanceof CellError) {
    return b
  } else {
    return op(a, b)
  }
}

function wrapperForAddress(val: InterpreterValue, adr: SimpleCellAddress): InterpreterValue {
  if(val instanceof CellError) {
    return val.attachAddress(adr)
  }
  return val
}
