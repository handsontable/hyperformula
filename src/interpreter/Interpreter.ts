/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'
import {ArraySizePredictor} from '../ArraySize'
import {ArrayValue, NotComputedArray} from '../ArrayValue'
import {CellError, ErrorType, isColOrRowInvalid} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {FormulaVertex} from '../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../error-message'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {ColumnSearchStrategy} from '../Lookup/SearchStrategy'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, CellRangeAst, ColumnRangeAst, ProcedureAst, RowRangeAst} from '../parser/Ast'
import {Serialization} from '../Serialization'
import {Statistics} from '../statistics/Statistics'
import {
  ArithmeticHelper,
  coerceRangeToScalar,
  coerceScalarToString,
  coerceToRange,
  fixNegativeZero,
  isNumberOverflow
} from './ArithmeticHelper'
import {CriterionBuilder} from './Criterion'
import {FunctionRegistry} from './FunctionRegistry'
import {InterpreterState} from './InterpreterState'
import {PendingValueRead} from './PendingValueRead'
import {
  cloneNumber,
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
} from './InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import { AddressWithSheet } from '../parser/Address'

/** A function can finish its method before its returned reference has a current value. */
export interface EvaluationCacheSlot {
  raw?: InterpreterValue,
  result?: InterpreterValue,
  execution?: Generator<PendingValueRead, InterpreterValue, void>,
}

export interface EvaluationCacheEntry extends EvaluationCacheSlot {
  ast?: Ast,
  preserveReference?: boolean,
  children: EvaluationCacheEntry[],
  nextChild: number,
}

export class Interpreter {
  public readonly criterionBuilder: CriterionBuilder
  private evaluationCache?: EvaluationCacheEntry
  private evaluationPath: EvaluationCacheEntry[] = []

  constructor(
    public readonly config: Config,
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: ColumnSearchStrategy,
    public readonly stats: Statistics,
    public readonly arithmeticHelper: ArithmeticHelper,
    private readonly functionRegistry: FunctionRegistry,
    private readonly namedExpressions: NamedExpressions,
    public readonly serialization: Serialization,
    public readonly arraySizePredictor: ArraySizePredictor,
    public readonly dateTimeHelper: DateTimeHelper
  ) {
    this.functionRegistry.initializePlugins(this)
    this.criterionBuilder = new CriterionBuilder(config)
  }

  /** Retains each expression invocation separately while a formula waits for a runtime target. */
  public setEvaluationCache(cache?: EvaluationCacheEntry): void {
    this.evaluationCache = cache
    this.evaluationPath.length = 0
    if (cache !== undefined) {
      cache.nextChild = 0
      this.evaluationPath.push(cache)
    }
  }

  /** A cell formula has this context only when it contains the built-in INDIRECT. */
  public hasEvaluationCache(): boolean {
    return this.evaluationCache !== undefined
  }

  /** Reports whether the current registration resolves to an engine built-in. */
  public isBuiltinFunction(name: string): boolean {
    return this.functionRegistry.isBuiltinFunction(name)
  }

  public evaluateAst(ast: Ast, state: InterpreterState, preserveReference = false): InterpreterValue {
    // Keep ordinary formula evaluation free of suspension-cache bookkeeping.
    if (this.evaluationCache === undefined) {
      let val = this.evaluateAstWithoutPostprocessing(ast, state, preserveReference)
      if (isExtendedNumber(val)) {
        if (isNumberOverflow(getRawValue(val))) {
          return new CellError(ErrorType.NUM, ErrorMessage.NaN)
        } else {
          val = cloneNumber(val, fixNegativeZero(getRawValue(val)))
        }
      }
      if (!preserveReference && val instanceof SimpleRangeValue && val.height() === 1 && val.width() === 1) {
        [[val]] = val.data
      }
      return wrapperForRootVertex(val, state.formulaVertex)
    }

    const parent = this.evaluationPath[this.evaluationPath.length - 1]
    let slot: EvaluationCacheEntry | undefined
    if (parent !== undefined) {
      const index = parent.nextChild++
      slot = parent.children[index]
      if (slot?.ast !== ast || slot.preserveReference !== preserveReference) {
        slot = {ast, preserveReference, children: [], nextChild: 0}
        parent.children.splice(index, 0, slot)
      }
      if (slot.result !== undefined) {
        return slot.result
      }
      if (slot.execution === undefined) {
        slot.nextChild = 0
      }
      this.evaluationPath.push(slot)
    }
    try {
      let val = slot?.raw ?? this.evaluateAstWithoutPostprocessing(ast, state, preserveReference, slot)
      if (slot !== undefined) {
        slot.raw = val
      }
      if (isExtendedNumber(val)) {
        if (isNumberOverflow(getRawValue(val))) {
          return new CellError(ErrorType.NUM, ErrorMessage.NaN)
        } else {
          val = cloneNumber(val, fixNegativeZero(getRawValue(val)))
        }
      }
      if (!preserveReference && val instanceof SimpleRangeValue && val.height() === 1 && val.width() === 1) {
        [[val]] = val.data
      }
      const result = wrapperForRootVertex(val, state.formulaVertex)
      if (slot !== undefined) {
        slot.result = result
      }
      return result
    } catch (error) {
      if (error instanceof PendingValueRead && parent !== undefined) {
        parent.nextChild--
      }
      throw error
    } finally {
      if (slot !== undefined) {
        this.evaluationPath.pop()
      }
    }
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param {Ast} ast - abstract syntax tree of formula
   * @param {InterpreterState} state - interpreter state
   */
  private evaluateAstWithoutPostprocessing(ast: Ast, state: InterpreterState, preserveReference: boolean, slot?: EvaluationCacheSlot): InterpreterValue {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return EmptyValue
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(state.formulaAddress)

        if (isColOrRowInvalid(address)) {
          return new CellError(ErrorType.REF, ErrorMessage.BadRef)
        }

        if (!this.isSheetValid(ast.reference)) {
          return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
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
        if (pluginFunction !== undefined) {
          const functionState = new InterpreterState(state.formulaAddress, state.arraysFlag || this.functionRegistry.isArrayFunction(ast.procedureName), state.formulaVertex)
          const hasIndirectArgument = (state.formulaVertex === undefined || this.evaluationCache !== undefined) &&
            ast.args.some(arg => this.containsIndirect(arg))
          const resumable = hasIndirectArgument ? this.functionRegistry.getResumableFunction(ast.procedureName) : undefined
          if (resumable !== undefined) {
            const execution = slot?.execution ?? resumable(ast, functionState)
            if (slot !== undefined) {
              slot.execution = execution
            }
            let step: IteratorResult<PendingValueRead, InterpreterValue>
            try {
              step = execution.next()
            } catch (error) {
              if (slot !== undefined) {
                slot.execution = undefined
              }
              if (error instanceof PendingValueRead) {
                return new CellError(ErrorType.VALUE, ErrorMessage.ResumablePluginRead(ast.procedureName))
              }
              throw error
            }
            if (step.done) {
              if (slot !== undefined) {
                slot.execution = undefined
              }
              return step.value
            }
            throw step.value
          }
          if (!this.functionRegistry.isBuiltinFunction(ast.procedureName) && hasIndirectArgument) {
            return new CellError(ErrorType.VALUE, ErrorMessage.ResumablePluginRequired(ast.procedureName))
          }
          try {
            return pluginFunction(ast, functionState)
          } catch (error) {
            if (error instanceof PendingValueRead && !this.functionRegistry.isBuiltinFunction(ast.procedureName)) {
              return new CellError(ErrorType.VALUE, ErrorMessage.ResumablePluginRequired(ast.procedureName))
            }
            throw error
          }
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
        if (!this.isSheetValid(ast.start) || !this.isSheetValid(ast.end)) {
          return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
        }

        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }

        const range = AbsoluteCellRange.fromCellRange(ast, state.formulaAddress)
        const arrayVertex = this.dependencyGraph.getArray(range)

        if (arrayVertex) {
          const array = arrayVertex.array
          if (array instanceof NotComputedArray) {
            throw new Error('Array should be already computed')
          } else if (array instanceof CellError) {
            return array
          } else if (array instanceof ArrayValue) {
            return SimpleRangeValue.fromRange(array.raw(), range, this.dependencyGraph)
          } else {
            throw new Error('Unknown array')
          }
        }

        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.COLUMN_RANGE: {
        if (!this.isSheetValid(ast.start) || !this.isSheetValid(ast.end)) {
          return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
        }

        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
        const range = AbsoluteColumnRange.fromColumnRange(ast, state.formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.ROW_RANGE: {
        if (!this.isSheetValid(ast.start) || !this.isSheetValid(ast.end)) {
          return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
        }

        if (!this.rangeSpansOneSheet(ast)) {
          return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
        }
        const range = AbsoluteRowRange.fromRowRangeAst(ast, state.formulaAddress)
        return SimpleRangeValue.onlyRange(range, this.dependencyGraph)
      }
      case AstNodeType.PARENTHESIS: {
        return this.evaluateAst(ast.expression, state, preserveReference)
      }
      case AstNodeType.ARRAY: {
        let totalWidth: Maybe<number> = undefined
        const ret: InternalScalarValue[][] = []
        for (const astRow of ast.args) {
          let rowHeight: Maybe<number> = undefined
          const rowRet: InternalScalarValue[][] = []
          for (const astIt of astRow) {
            const arr = coerceToRange(this.evaluateAst(astIt, state))
            const height = arr.height()
            if (rowHeight === undefined) {
              rowHeight = height
              rowRet.push(...arr.data)
            } else if (rowHeight === height) {
              for (let i = 0; i < height; i++) {
                rowRet[i].push(...arr.data[i])
              }
            } else {
              return new CellError(ErrorType.REF, ErrorMessage.SizeMismatch)
            }
          }
          const width = rowRet[0].length
          if (totalWidth === undefined) {
            totalWidth = width
            ret.push(...rowRet)
          } else if (totalWidth === width) {
            ret.push(...rowRet)
          } else {
            return new CellError(ErrorType.REF, ErrorMessage.SizeMismatch)
          }
        }
        return SimpleRangeValue.onlyValues(ret)
      }
      case AstNodeType.ERROR_WITH_RAW_INPUT:
      case AstNodeType.ERROR: {
        return ast.error
      }
    }
  }

  /** Detects INDIRECT syntax in an argument, including nested expressions. */
  public containsIndirect(ast: Ast): boolean {
    switch (ast.type) {
      case AstNodeType.FUNCTION_CALL:
        return (ast.procedureName === 'INDIRECT' && this.functionRegistry.isBuiltinFunction('INDIRECT')) ||
          ast.args.some(arg => this.containsIndirect(arg))
      case AstNodeType.ARRAY:
        return ast.args.some(row => row.some(arg => this.containsIndirect(arg)))
      case AstNodeType.PARENTHESIS:
        return this.containsIndirect(ast.expression)
      case AstNodeType.PERCENT_OP:
      case AstNodeType.PLUS_UNARY_OP:
      case AstNodeType.MINUS_UNARY_OP:
        return this.containsIndirect(ast.value)
      case AstNodeType.CONCATENATE_OP:
      case AstNodeType.EQUALS_OP:
      case AstNodeType.NOT_EQUAL_OP:
      case AstNodeType.LESS_THAN_OP:
      case AstNodeType.GREATER_THAN_OP:
      case AstNodeType.LESS_THAN_OR_EQUAL_OP:
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
      case AstNodeType.MINUS_OP:
      case AstNodeType.PLUS_OP:
      case AstNodeType.TIMES_OP:
      case AstNodeType.DIV_OP:
      case AstNodeType.POWER_OP:
        return this.containsIndirect(ast.left) || this.containsIndirect(ast.right)
      default:
        return false
    }
  }

  /**
   * Sheet is valid if:
   * - sheet is undefined OR
   * - sheet is a named expressions store OR
   * - sheet exists in sheet mapping
   * - sheet is not a placeholder
   */
  private isSheetValid(address: AddressWithSheet): boolean {
    return address.sheet === undefined || address.sheet === NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS || this.dependencyGraph.sheetMapping.hasSheetWithId(address.sheet, { includePlaceholders: false })
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
    if (arg instanceof SimpleRangeValue && !state.arraysFlag) {
      arg = coerceRangeToScalar(arg, state) ?? new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    }
    if (arg instanceof CellError) {
      return arg
    }
    if (arg instanceof SimpleRangeValue) {
      const newRaw = arg.data.map(
        (row) => row.map(op)
      )
      return SimpleRangeValue.onlyValues(newRaw)
    }

    return op(arg)
  }

  private binaryRangeWrapper(op: (arg1: InternalScalarValue, arg2: InternalScalarValue) => InternalScalarValue, arg1: InterpreterValue, arg2: InterpreterValue, state: InterpreterState): InterpreterValue {
    if (arg1 instanceof SimpleRangeValue && !state.arraysFlag) {
      arg1 = coerceRangeToScalar(arg1, state) ?? new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    }
    if (arg1 instanceof CellError) {
      return arg1
    }
    if (arg2 instanceof SimpleRangeValue && !state.arraysFlag) {
      arg2 = coerceRangeToScalar(arg2, state) ?? new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    }
    if (arg2 instanceof CellError) {
      return arg2
    }
    if (arg1 instanceof SimpleRangeValue || arg2 instanceof SimpleRangeValue) {
      if (!(arg1 instanceof SimpleRangeValue)) {
        if ((arg2 as SimpleRangeValue).isAdHoc()) {
          const raw2 = (arg2 as SimpleRangeValue).data
          for (let i = 0; i < raw2.length; i++) {
            for (let j = 0; j < raw2[0].length; j++) {
              raw2[i][j] = op(arg1, raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw2)
        } else {
          arg1 = SimpleRangeValue.fromScalar(arg1)
        }
      }
      if (!(arg2 instanceof SimpleRangeValue)) {
        if (arg1.isAdHoc()) {
          const raw1 = arg1.data
          for (let i = 0; i < raw1.length; i++) {
            for (let j = 0; j < raw1[0].length; j++) {
              raw1[i][j] = op(raw1[i][j], arg2)
            }
          }
          return SimpleRangeValue.onlyValues(raw1)
        } else {
          arg2 = SimpleRangeValue.fromScalar(arg2)
        }
      }
      if (arg1.width() === arg2.width() && arg1.height() === arg2.height()) {
        if (arg1.isAdHoc()) {
          const raw1 = arg1.data
          const raw2 = arg2.data
          for (let i = 0; i < raw1.length; i++) {
            for (let j = 0; j < raw1[0].length; j++) {
              raw1[i][j] = op(raw1[i][j], raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw1)
        }
        if (arg2.isAdHoc()) {
          const raw1 = arg1.data
          const raw2 = arg2.data
          for (let i = 0; i < raw1.length; i++) {
            for (let j = 0; j < raw1[0].length; j++) {
              raw2[i][j] = op(raw1[i][j], raw2[i][j])
            }
          }
          return SimpleRangeValue.onlyValues(raw2)
        }
      }
      const width = Math.max(arg1.width(), arg2.width())
      const height = Math.max(arg1.height(), arg2.height())
      const ret: InternalScalarValue[][] = Array(height)
      for (let i = 0; i < height; i++) {
        ret[i] = Array(width)
      }
      for (let i = 0; i < height; i++) {
        const i1 = (arg1.height() !== 1) ? i : 0
        const i2 = (arg2.height() !== 1) ? i : 0
        for (let j = 0; j < width; j++) {
          const j1 = (arg1.width() !== 1) ? j : 0
          const j2 = (arg2.width() !== 1) ? j : 0
          if (i1 < arg1.height() && i2 < arg2.height() && j1 < arg1.width() && j2 < arg2.width()) {
            ret[i][j] = op(arg1.data[i1][j1], arg2.data[i2][j2])
          } else {
            ret[i][j] = new CellError(ErrorType.NA)
          }
        }
      }
      return SimpleRangeValue.onlyValues(ret)
    }

    return op(arg1, arg2)
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

function wrapperForRootVertex(val: InterpreterValue, vertex?: FormulaVertex): InterpreterValue {
  if (val instanceof CellError && vertex !== undefined) {
    return val.attachRootVertex(vertex)
  }
  return val
}
