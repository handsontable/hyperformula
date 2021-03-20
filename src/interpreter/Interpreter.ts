/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, invalidSimpleCellAddress, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {ErrorMessage} from '../error-message'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {ColumnSearchStrategy} from '../Lookup/SearchStrategy'
import {Matrix, NotComputedMatrix} from '../Matrix'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, CellRangeAst, ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {Serialization} from '../Serialization'
import {Statistics} from '../statistics/Statistics'
import {ArithmeticHelper, coerceScalarToString, fixNegativeZero, isNumberOverflow} from './ArithmeticHelper'
import {CriterionBuilder} from './Criterion'
import {FunctionRegistry} from './FunctionRegistry'
import {
  cloneNumber,
  EmptyValue,
  getRawValue,
  InternalNoErrorScalarValue, InternalScalarValue,
  isExtendedNumber,
} from './InterpreterValue'
import {InterpreterValue} from './InterpreterValue'
import type {GPU} from 'gpu.js'
import {SimpleRangeValue} from './SimpleRangeValue'

export class Interpreter {
  private gpu?: GPU
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
    let val = this.evaluateAstWithoutPostprocessing(ast, formulaAddress)
    if (isExtendedNumber(val)) {
      if (isNumberOverflow(getRawValue(val))) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      } else {
        val = cloneNumber(val, fixNegativeZero(getRawValue(val)))
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
  private evaluateAstWithoutPostprocessing(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
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
        return this.concatOp(leftResult, rightResult)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.equalOp(leftResult, rightResult)
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.notEqualOp(leftResult, rightResult)
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.greaterThanOp(leftResult, rightResult)
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.lessThanOp(leftResult, rightResult)
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.greaterThanOrEqualOp(leftResult, rightResult)
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.lessThanOrEqualOp(leftResult, rightResult)
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.plusOp(leftResult, rightResult)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.minusOp(leftResult, rightResult)
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.timesOp(leftResult, rightResult)
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.powerOp(leftResult, rightResult)
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.divOp(leftResult, rightResult)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return unaryRangeWrapper(this.unaryPlusOp, result)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return unaryRangeWrapper(this.unaryMinusOp, result)
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return unaryRangeWrapper(this.percentOp, result)
      }
      case AstNodeType.FUNCTION_CALL: {
        if (this.config.licenseKeyValidityState !== LicenseKeyValidityState.VALID && !FunctionRegistry.functionIsProtected(ast.procedureName)) {
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

  public getGpuInstance(): GPU {
    const mode = this.config.gpuMode
    const gpujs = this.config.gpujs

    if (gpujs === undefined) {
      throw Error('Cannot instantiate GPU.js. Constructor not provided.')
    }

    if (!this.gpu) {
      this.gpu = new gpujs({mode})
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

  private equalOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.eq(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private notEqualOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.neq(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private greaterThanOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.gt(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private lessThanOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.lt(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private greaterThanOrEqualOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.geq(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private lessThanOrEqualOp(arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    return passErrors(arg1, arg2) ??
      this.arithmeticHelper.leq(arg1 as InternalNoErrorScalarValue, arg2 as InternalNoErrorScalarValue)
  }

  private concatOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(this.arithmeticHelper.concat,
        coerceScalarToString(arg1 as InternalNoErrorScalarValue),
        coerceScalarToString(arg2 as InternalNoErrorScalarValue)
      )
  }


  private plusOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(this.arithmeticHelper.addWithEpsilon,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1 as InternalNoErrorScalarValue),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2 as InternalNoErrorScalarValue)
      )
  }

  private minusOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(this.arithmeticHelper.subtract,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1 as InternalNoErrorScalarValue),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2 as InternalNoErrorScalarValue)
      )
  }

  private timesOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(
        this.arithmeticHelper.multiply,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1 as InternalNoErrorScalarValue),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2 as InternalNoErrorScalarValue)
      )
  }

  private powerOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(
        this.arithmeticHelper.pow,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1 as InternalNoErrorScalarValue),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2 as InternalNoErrorScalarValue)
      )
  }

  private divOp(arg1: InterpreterValue, arg2: InterpreterValue): InternalScalarValue {
    return passErrors(arg1, arg2) ??
      binaryErrorWrapper(
        this.arithmeticHelper.divide,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1 as InternalNoErrorScalarValue),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2 as InternalNoErrorScalarValue)
      )
  }

  private unaryMinusOp = (arg: InternalScalarValue): InternalScalarValue =>
    unaryErrorWrapper(this.arithmeticHelper.unaryMinus,
      this.arithmeticHelper.coerceScalarToNumberOrError(arg))

  private percentOp = (arg: InternalScalarValue): InternalScalarValue =>
    unaryErrorWrapper(this.arithmeticHelper.unaryPercent,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg))

  private unaryPlusOp = (arg: InternalScalarValue): InternalScalarValue =>
    (isExtendedNumber(arg) ? this.arithmeticHelper.unaryPlus(arg) : arg)
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

function unaryErrorWrapper<T extends InterpreterValue>(op: (a: T) => InternalScalarValue, a: T | CellError): InternalScalarValue {
  if (a instanceof CellError) {
    return a
  } else {
    return op(a)
  }
}

function binaryErrorWrapper<T extends InterpreterValue>(op: (a: T, b: T) => InternalScalarValue, a: T | CellError, b: T | CellError): InternalScalarValue {
  if (a instanceof CellError) {
    return a
  } else if (b instanceof CellError) {
    return b
  } else {
    return op(a, b)
  }
}

function wrapperForAddress(val: InterpreterValue, adr: SimpleCellAddress): InterpreterValue {
  if (val instanceof CellError) {
    return val.attachAddress(adr)
  }
  return val
}

function unaryRangeWrapper(op: (arg: InternalScalarValue) => InternalScalarValue, arg: InterpreterValue): InterpreterValue {
  if(arg instanceof SimpleRangeValue) {
    const newRaw = arg.raw().map(
      (row) => row.map(op)
    )
    return SimpleRangeValue.onlyValues(newRaw)
  }
  return op(arg)
}

function binaryRangeWrapper(op: (arg1: InternalScalarValue, arg2: InternalScalarValue) => InternalScalarValue, arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
  if(arg1 instanceof SimpleRangeValue || arg2 instanceof SimpleRangeValue) {
    if(!(arg1 instanceof SimpleRangeValue)) {
      arg1 = SimpleRangeValue.fromScalar(arg1)
    }
    if(!(arg2 instanceof SimpleRangeValue)) {
      arg2 = SimpleRangeValue.fromScalar(arg2)
    }
    const width = Math.max(arg1.width(), arg2.width())
    const height = Math.max(arg1.height(), arg2.height())
    const ret: InternalScalarValue[][] = Array(height)
    for(let i=0;i<height;i++) {
      ret[i] = Array(width)
    }
    for(let i=0;i<height;i++) {
      const i1 = (arg1.height() !== 1) ? i : 0
      const i2 = (arg2.height() !== 1) ? i : 0
      for(let j=0;j<width;j++) {
        const j1 = (arg1.width() !== 1) ? j : 0
        const j2 = (arg2.width() !== 1) ? j : 0
        if(i1 < arg1.height() && i2 < arg2.height() && j1 < arg1.width() && j2 < arg2.width()) {
          ret[i][j] = op(arg1.raw()[i1][j1], arg2.raw()[i2][j2])
        } else {
          ret[i][j] =  new CellError(ErrorType.NA)
        }
      }
    }
    return SimpleRangeValue.onlyValues(ret)
  }

  return op(arg1, arg2)
}
