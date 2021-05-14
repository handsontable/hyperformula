/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {GPU} from 'gpu.js'
import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, invalidSimpleCellAddress, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {ErrorMessage} from '../error-message'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {ColumnSearchStrategy} from '../Lookup/SearchStrategy'
import {Matrix, NotComputedMatrix} from '../Matrix'
import {NamedExpressions} from '../NamedExpressions'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, CellRangeAst, ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {Serialization} from '../Serialization'
import {Statistics} from '../statistics/Statistics'
import {ArithmeticHelper, coerceScalarToString, fixNegativeZero, isNumberOverflow} from './ArithmeticHelper'
import {CriterionBuilder} from './Criterion'
import {FunctionRegistry} from './FunctionRegistry'
import {InterpreterState} from './InterpreterState'
import {
  cloneNumber,
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
} from './InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import {PluginFunctionType} from './plugin/FunctionPlugin'

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

  public evaluateAst(ast: Ast, state: InterpreterState): InterpreterValue {
    let val = this.evaluateAstWithoutPostprocessing(ast, state)
    if (isExtendedNumber(val)) {
      if (isNumberOverflow(getRawValue(val))) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      } else {
        val = cloneNumber(val, fixNegativeZero(getRawValue(val)))
      }
    }
    if(val instanceof SimpleRangeValue && val.height() === 1 && val.width() === 1) {
      [[val]] = val.data
    }
    return wrapperForAddress(val, state.formulaAddress)
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  private evaluateAstWithoutPostprocessing(ast: Ast, state: InterpreterState): InterpreterValue {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return EmptyValue
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(state.formulaAddress)
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
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.concatOp, leftResult, rightResult, state)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.equalOp, leftResult, rightResult, state)
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.notEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.greaterThanOp, leftResult, rightResult, state)
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.lessThanOp, leftResult, rightResult, state)
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.greaterThanOrEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.lessThanOrEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.plusOp, leftResult, rightResult, state)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.minusOp, leftResult, rightResult, state)
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.timesOp, leftResult, rightResult, state)
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.powerOp, leftResult, rightResult, state)
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryRangeWrapper(this.divOp, leftResult, rightResult, state)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryRangeWrapper(this.unaryPlusOp, result, state)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryRangeWrapper(this.unaryMinusOp, result, state)
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryRangeWrapper(this.percentOp, result, state)
      }
      case AstNodeType.FUNCTION_CALL: {
        if (this.config.licenseKeyValidityState !== LicenseKeyValidityState.VALID && !FunctionRegistry.functionIsProtected(ast.procedureName)) {
          return new CellError(ErrorType.LIC, ErrorMessage.LicenseKey(this.config.licenseKeyValidityState))
        }
        const pluginFunction = this.functionRegistry.getFunction(ast.procedureName)
        if(pluginFunction!==undefined) {
          return pluginFunction(ast, new InterpreterState(state.formulaAddress, state.arraysFlag || this.functionRegistry.isArrayFunction(ast.procedureName)))
        } else {
          return new CellError(ErrorType.NAME, ErrorMessage.FunctionName(ast.procedureName))
        }
      }
      case AstNodeType.NAMED_EXPRESSION: {
        const namedExpression = this.namedExpressions.nearestNamedExpression(ast.expressionName, state.formulaAddress.sheet)
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
        const range = AbsoluteCellRange.fromCellRange(ast, state.formulaAddress)
        const matrixVertex = this.dependencyGraph.getMatrix(range)
        if (matrixVertex) {
          const matrix = matrixVertex.matrix
          if (matrix instanceof NotComputedMatrix) {
            throw new Error('Matrix should be already computed')
          } else if (matrix instanceof CellError) {
            return matrix
          } else if (matrix instanceof Matrix) {
            return SimpleRangeValue.numbersRange(matrix.raw(), range, this.dependencyGraph)
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
        const range = AbsoluteColumnRange.fromColumnRange(ast, state.formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.ROW_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
        const range = AbsoluteRowRange.fromRowRange(ast, state.formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.PARENTHESIS: {
        return this.evaluateAst(ast.expression, state)
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

  private equalOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.eq, arg1, arg2)

  private notEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.neq, arg1, arg2)

  private greaterThanOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.gt, arg1, arg2)

  private lessThanOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.lt, arg1, arg2)

  private greaterThanOrEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.geq, arg1, arg2)

  private lessThanOrEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
    binaryErrorWrapper(this.arithmeticHelper.leq, arg1, arg2)

  private concatOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
       binaryErrorWrapper(this.arithmeticHelper.concat,
        coerceScalarToString(arg1),
        coerceScalarToString(arg2)
      )

  private plusOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
      binaryErrorWrapper(this.arithmeticHelper.addWithEpsilon,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      )

  private minusOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
      binaryErrorWrapper(this.arithmeticHelper.subtract,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      )

  private timesOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
      binaryErrorWrapper(
        this.arithmeticHelper.multiply,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      )

  private powerOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
      binaryErrorWrapper(
        this.arithmeticHelper.pow,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      )

  private divOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue =>
      binaryErrorWrapper(
        this.arithmeticHelper.divide,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
        this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      )

  private unaryMinusOp = (arg: InternalScalarValue): InternalScalarValue =>
    unaryErrorWrapper(this.arithmeticHelper.unaryMinus,
      this.arithmeticHelper.coerceScalarToNumberOrError(arg))

  private percentOp = (arg: InternalScalarValue): InternalScalarValue =>
    unaryErrorWrapper(this.arithmeticHelper.unaryPercent,
        this.arithmeticHelper.coerceScalarToNumberOrError(arg))

  private unaryPlusOp = (arg: InternalScalarValue): InternalScalarValue => this.arithmeticHelper.unaryPlus(arg)

  private unaryRangeWrapper(op: (arg: InternalScalarValue) => InternalScalarValue, arg: InterpreterValue, state: InterpreterState): InterpreterValue {
    if (arg instanceof CellError) {
      return arg
    } else if(arg instanceof SimpleRangeValue) {
      if(!state.arraysFlag) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      }
      const newRaw = arg.data.map(
        (row) => row.map(op)
      )
      return SimpleRangeValue.onlyValues(newRaw)
    } else {
      return op(arg)
    }
  }

  private binaryRangeWrapper(op: (arg1: InternalScalarValue, arg2: InternalScalarValue) => InternalScalarValue, arg1: InterpreterValue, arg2: InterpreterValue, state: InterpreterState): InterpreterValue {
    if (arg1 instanceof CellError) {
      return arg1
    } else if(arg1 instanceof SimpleRangeValue && !state.arraysFlag) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    } else if (arg2 instanceof CellError) {
      return arg2
    } else if(arg2 instanceof SimpleRangeValue && !state.arraysFlag) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    } else if(arg1 instanceof SimpleRangeValue || arg2 instanceof SimpleRangeValue) {
      if(!(arg1 instanceof SimpleRangeValue)) {
        if((arg2 as SimpleRangeValue).isAdHoc()) {
          const raw2 = (arg2 as SimpleRangeValue).data
          for(let i=0;i<raw2.length;i++) {
            for(let j=0;j<raw2[0].length;j++) {
              raw2[i][j] = op(arg1 as InternalScalarValue, raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw2)
        } else {
          arg1 = SimpleRangeValue.fromScalar(arg1)
        }
      }
      if(!(arg2 instanceof SimpleRangeValue)) {
        if(arg1.isAdHoc()) {
          const raw1 = arg1.data
          for(let i=0;i<raw1.length;i++) {
            for(let j=0;j<raw1[0].length;j++) {
              raw1[i][j] = op(raw1[i][j], arg2)
            }
          }
          return SimpleRangeValue.onlyValues(raw1)
        } else {
          arg2 = SimpleRangeValue.fromScalar(arg2)
        }
      }
      if(arg1.width()===arg2.width() && arg1.height()===arg2.height()) {
        if(arg1.isAdHoc()) {
          const raw1 = arg1.data
          const raw2 = arg2.data
          for(let i=0;i<raw1.length;i++) {
            for(let j=0;j<raw1[0].length;j++) {
              raw1[i][j] = op(raw1[i][j], raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw1)
        }
        if(arg2.isAdHoc()) {
          const raw1 = arg1.data
          const raw2 = arg2.data
          for(let i=0;i<raw1.length;i++) {
            for(let j=0;j<raw1[0].length;j++) {
              raw2[i][j] = op(raw1[i][j], raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw2)
        }
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
            ret[i][j] = op(arg1.data[i1][j1], arg2.data[i2][j2])
          } else {
            ret[i][j] =  new CellError(ErrorType.NA)
          }
        }
      }
      return SimpleRangeValue.onlyValues(ret)
    } else {
      return op(arg1, arg2)
    }
  }
}

function unaryErrorWrapper<T extends InterpreterValue>(op: (arg: T) => InternalScalarValue, arg: T | CellError): InternalScalarValue {
  if (arg instanceof CellError) {
    return arg
  } else {
    return op(arg)
  }
}

function binaryErrorWrapper<T extends InterpreterValue>(op: (arg1: T, arg2: T) => InternalScalarValue, arg1: T | CellError, arg2: T | CellError): InternalScalarValue {
  if (arg1 instanceof CellError) {
    return arg1
  } else if (arg2 instanceof CellError) {
    return arg2
  } else {
    return op(arg1, arg2)
  }
}

function wrapperForAddress(val: InterpreterValue, adr: SimpleCellAddress): InterpreterValue {
  if (val instanceof CellError) {
    return val.attachAddress(adr)
  }
  return val
}

