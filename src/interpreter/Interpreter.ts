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
import {ColumnSearchStrategy} from '../ColumnSearch/ColumnSearchStrategy'
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
import {ArithmeticHelper, coerceScalarToString, divide} from './ArithmeticHelper'
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

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return wrap(EmptyValue, formulaAddress)
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(formulaAddress)
        if (invalidSimpleCellAddress(address)) {
          return wrap(new CellError(ErrorType.REF, ErrorMessage.BadRef), formulaAddress)
        }
        return wrap(this.dependencyGraph.getCellValue(address), formulaAddress)
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return wrap(ast.value, formulaAddress)
      }
      case AstNodeType.CONCATENATE_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary((a, b) => a.concat(b),
            coerceScalarToString(leftResult as InternalNoErrorCellValue),
            coerceScalarToString(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) === 0,
          formulaAddress)
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) !== 0,
          formulaAddress)
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) > 0,
          formulaAddress)
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) < 0,
          formulaAddress)
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) >= 0,
          formulaAddress)
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          this.arithmeticHelper.compare(leftResult as InternalNoErrorCellValue, rightResult as InternalNoErrorCellValue) <= 0,
          formulaAddress)
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary(this.arithmeticHelper.addWithEpsilon,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary(this.arithmeticHelper.subtract,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary(
            (a, b) => a*b,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary(
            Math.pow,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return wrap(passErrors(leftResult, rightResult) ??
          wrapperBinary(
            divide,
            this.arithmeticHelper.coerceScalarToNumberOrError(leftResult as InternalNoErrorCellValue),
            this.arithmeticHelper.coerceScalarToNumberOrError(rightResult as InternalNoErrorCellValue)
          ), formulaAddress)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return wrap(new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected), formulaAddress)
        } else {
          return wrap(result, formulaAddress)
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return wrap(new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected), formulaAddress)
        } else {
          return wrap(wrapperUnary((a) => -a,
            this.arithmeticHelper.coerceScalarToNumberOrError(result)), formulaAddress)
        }
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        if (result instanceof SimpleRangeValue) {
          return wrap(new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected), formulaAddress)
        } else {
          return wrap(wrapperUnary((a) => a/100,
            this.arithmeticHelper.coerceScalarToNumberOrError(result)), formulaAddress)
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        if(this.config.licenseKeyValidityState !== LicenseKeyValidityState.VALID && !FunctionRegistry.functionIsProtected(ast.procedureName)) {
          return wrap(new CellError(ErrorType.LIC, ErrorMessage.LicenseKey(this.config.licenseKeyValidityState)), formulaAddress)
        }
        const pluginEntry = this.functionRegistry.getFunction(ast.procedureName)
        if (pluginEntry && this.config.translationPackage.isFunctionTranslated(ast.procedureName)) {
          const [pluginFunction, pluginInstance] = pluginEntry as [string, any]
          return wrap(pluginInstance[pluginFunction](ast, formulaAddress), formulaAddress)
        } else {
          return wrap(new CellError(ErrorType.NAME, ErrorMessage.FunctionName(ast.procedureName)), formulaAddress)
        }
      }
      case AstNodeType.NAMED_EXPRESSION: {
        const namedExpression = this.namedExpressions.nearestNamedExpression(ast.expressionName, formulaAddress.sheet)
        if (namedExpression) {
          return wrap(this.dependencyGraph.getCellValue(namedExpression.address), formulaAddress)
        } else {
          return wrap(new CellError(ErrorType.NAME, ErrorMessage.NamedExpressionName(ast.expressionName)), formulaAddress)
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return wrap(new CellError(ErrorType.REF, ErrorMessage.RangeManySheets), formulaAddress)
        }
        const range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
        const matrixVertex = this.dependencyGraph.getMatrix(range)
        if (matrixVertex) {
          const matrix = matrixVertex.matrix
          if (matrix instanceof NotComputedMatrix) {
            throw new Error('Matrix should be already computed')
          } else if (matrix instanceof CellError) {
            return wrap(matrix, formulaAddress)
          } else if (matrix instanceof Matrix) {
            return wrap(SimpleRangeValue.onlyNumbersDataWithRange(matrix.raw(), matrix.size, range), formulaAddress)
          } else {
            throw new Error('Unknown matrix')
          }
        } else {
          return wrap(SimpleRangeValue.onlyRange(range, this.dependencyGraph), formulaAddress)
        }
      }
      case AstNodeType.COLUMN_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return wrap(new CellError(ErrorType.REF, ErrorMessage.RangeManySheets), formulaAddress)
        }
        const range = AbsoluteColumnRange.fromColumnRange(ast, formulaAddress)
        return wrap(SimpleRangeValue.onlyRange(range, this.dependencyGraph), formulaAddress)
      }
      case AstNodeType.ROW_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return wrap(new CellError(ErrorType.REF, ErrorMessage.RangeManySheets), formulaAddress)
        }
        const range = AbsoluteRowRange.fromRowRange(ast, formulaAddress)
        return wrap(SimpleRangeValue.onlyRange(range, this.dependencyGraph), formulaAddress)
      }
      case AstNodeType.PARENTHESIS: {
        return wrap(this.evaluateAst(ast.expression, formulaAddress), formulaAddress)
      }
      case AstNodeType.ERROR_WITH_RAW_INPUT:
      case AstNodeType.ERROR: {
        return wrap(ast.error, formulaAddress)
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

function wrap(val: InterpreterValue, adr: SimpleCellAddress): InterpreterValue {
  if(val instanceof CellError) {
    val.address = val.address ?? adr
  }
  return val
}
