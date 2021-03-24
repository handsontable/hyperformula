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
import {
  cloneNumber,
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
} from './InterpreterValue'
import {ArrayData, SimpleRangeValue} from './SimpleRangeValue'

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
        return this.binaryRangeWrapper(this.concatOp, leftResult, rightResult)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.equalOp, leftResult, rightResult)
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.notEqualOp, leftResult, rightResult)
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.greaterThanOp, leftResult, rightResult)
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.lessThanOp, leftResult, rightResult)
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.greaterThanOrEqualOp, leftResult, rightResult)
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.lessThanOrEqualOp, leftResult, rightResult)
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.plusOp, leftResult, rightResult)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.minusOp, leftResult, rightResult)
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.timesOp, leftResult, rightResult)
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.powerOp, leftResult, rightResult)
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, formulaAddress)
        const rightResult = this.evaluateAst(ast.right, formulaAddress)
        return this.binaryRangeWrapper(this.divOp, leftResult, rightResult)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return this.unaryRangeWrapper(this.unaryPlusOp, result)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return this.unaryRangeWrapper(this.unaryMinusOp, result)
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, formulaAddress)
        return this.unaryRangeWrapper(this.percentOp, result)
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

  private equalOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //(arg1 === arg2)
    binaryErrorWrapper(this.arithmeticHelper.eq, arg1, arg2)

  private notEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //(arg1 !== arg2)
    binaryErrorWrapper(this.arithmeticHelper.neq, arg1, arg2)

  private greaterThanOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //((arg1 as number) > (arg2 as number))
    binaryErrorWrapper(this.arithmeticHelper.gt, arg1, arg2)

  private lessThanOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //((arg1 as number) < (arg2 as number))
    binaryErrorWrapper(this.arithmeticHelper.lt, arg1, arg2)

  private greaterThanOrEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //((arg1 as number) >= (arg2 as number))
    binaryErrorWrapper(this.arithmeticHelper.geq, arg1, arg2)

  private lessThanOrEqualOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => //((arg1 as number) <= (arg2 as number))
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

  private timesOp = (arg1: InternalScalarValue, arg2: InternalScalarValue): InternalScalarValue => ((arg1 as number) * (arg2 as number))
      // binaryErrorWrapper(
      //   this.arithmeticHelper.multiply,
      //   this.arithmeticHelper.coerceScalarToNumberOrError(arg1),
      //   this.arithmeticHelper.coerceScalarToNumberOrError(arg2)
      // )

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

  private unaryRangeWrapper(op: (arg: InternalScalarValue) => InternalScalarValue, arg: InterpreterValue): InterpreterValue {
    if (arg instanceof CellError) {
      return arg
    } else if(arg instanceof SimpleRangeValue) {
      if(!this.config.arrays) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      }
      const newRaw = arg.raw().map(
        (row) => row.map(op)
      )
      return SimpleRangeValue.onlyValues(newRaw)
    } else {
      return op(arg)
    }
  }

  private binaryRangeWrapper(op: (arg1: InternalScalarValue, arg2: InternalScalarValue) => InternalScalarValue, arg1: InterpreterValue, arg2: InterpreterValue): InterpreterValue {
    if (arg1 instanceof CellError) {
      return arg1
    } else if(arg1 instanceof SimpleRangeValue && !this.config.arrays) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    } else if (arg2 instanceof CellError) {
      return arg2
    } else if(arg2 instanceof SimpleRangeValue && !this.config.arrays) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    } else if(arg1 instanceof SimpleRangeValue || arg2 instanceof SimpleRangeValue) {
      if(!(arg1 instanceof SimpleRangeValue)) {
        if((arg2 as SimpleRangeValue).adhoc) {
          (arg2 as SimpleRangeValue).data.map((arg) => op(arg1 as InternalScalarValue, arg))
          return arg2
        } else {
          arg1 = SimpleRangeValue.fromScalar(arg1)
        }
      }
      if(!(arg2 instanceof SimpleRangeValue)) {
        if((arg1 as SimpleRangeValue).adhoc) {
          (arg1 as SimpleRangeValue).data.map((arg) => op(arg, arg2 as InternalScalarValue))
          return arg1
        } else {
          arg2 = SimpleRangeValue.fromScalar(arg2)
        }
      }
      if(arg1.width()===arg2.width() && arg1.height()===arg2.height()) {
        if(arg1.adhoc) {
          const raw1 = arg1.raw()
          const raw2 = arg2.raw()
          for(let i=0;i<raw1.length;i++) {
            for(let j=0;j<raw1[0].length;j++) {
              raw1[i][j] = op(raw1[i][j],raw2[i][j])
            }
          }
          return arg1
        }
        if(arg2.adhoc) {
          const raw1 = arg1.raw()
          const raw2 = arg2.raw()
          for(let i=0;i<raw1.length;i++) {
            for(let j=0;j<raw1[0].length;j++) {
              raw2[i][j] = op(raw1[i][j],raw2[i][j])
            }
          }
          return arg2
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
            ret[i][j] = op(arg1.raw()[i1][j1], arg2.raw()[i2][j2])
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

