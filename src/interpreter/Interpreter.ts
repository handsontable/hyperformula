/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'
import {ArraySizePredictor} from '../ArraySize'
import {ArrayValue, NotComputedArray} from '../ArrayValue'
import {CellError, ErrorType, invalidSimpleCellAddress, withTimeout} from '../Cell'
import { CellContentParser } from '../CellContentParser'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {DependencyGraph} from '../DependencyGraph'
import {FormulaVertex} from '../DependencyGraph/FormulaCellVertex'
import {ErrorMessage} from '../error-message'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {ColumnSearchStrategy} from '../Lookup/SearchStrategy'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
// noinspection TypeScriptPreferShortImport
import {Ast, AstNodeType, CellRangeAst, ColumnRangeAst, RowRangeAst} from '../parser/Ast'
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
import {
  AsyncInterpreterValue,
  AsyncPromiseVertex,
  cloneNumber,
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
  OptionalInterpreterTuple,
} from './InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'

export class Interpreter {
  public readonly criterionBuilder: CriterionBuilder
  private gpu?: any

  constructor(
    public readonly config: Config,
    public readonly dependencyGraph: DependencyGraph,
    public readonly columnSearch: ColumnSearchStrategy,
    public readonly stats: Statistics,
    public readonly arithmeticHelper: ArithmeticHelper,
    public readonly functionRegistry: FunctionRegistry,
    private readonly namedExpressions: NamedExpressions,
    public readonly serialization: Serialization,
    public readonly arraySizePredictor: ArraySizePredictor,
    public readonly dateTimeHelper: DateTimeHelper,
    public readonly cellContentParser: CellContentParser
  ) {
    this.functionRegistry.initializePlugins(this, cellContentParser)
    this.criterionBuilder = new CriterionBuilder(config)
  }

  private convertPostProcessingValue(val: InterpreterValue, state: InterpreterState) {
    let newVal = val

    if (isExtendedNumber(newVal)) {
      if (isNumberOverflow(getRawValue(newVal))) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      } else {
        newVal = cloneNumber(newVal, fixNegativeZero(getRawValue(newVal)))
      }
    }
    if (newVal instanceof SimpleRangeValue && newVal.height() === 1 && newVal.width() === 1) {
      [[newVal]] = newVal.data
    }
    return wrapperForRootVertex(newVal, state.formulaVertex)
  }

  public evaluateAst(ast: Ast, state: InterpreterState): OptionalInterpreterTuple {
    const val = this.evaluateAstWithoutPostprocessing(ast, state)

    return [this.convertPostProcessingValue(val[0], state), val[1]]
  }

  public getGpuInstance(): any {
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

  public destroyGpu() {
    this.gpu?.destroy()
  }

  /**
   * Calculates cell value from formula abstract syntax tree
   *
   * @param formula - abstract syntax tree of formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  private evaluateAstWithoutPostprocessing(ast: Ast, state: InterpreterState): OptionalInterpreterTuple {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return [EmptyValue]
      }
      case AstNodeType.CELL_REFERENCE: {
        const address = ast.reference.toSimpleCellAddress(state.formulaAddress)
        if (invalidSimpleCellAddress(address)) {
          return [new CellError(ErrorType.REF, ErrorMessage.BadRef)]
        }
        const cell = this.dependencyGraph.getCell(address)
        const cellValue = this.dependencyGraph.getCellValue(address)

        if (cell instanceof FormulaVertex ) {
          const asyncPromiseVertex = {
            asyncVertex: cell,
          }

          return [cellValue, asyncPromiseVertex]
        }

        return [cellValue]
      }
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return [ast.value]
      }
      case AstNodeType.CONCATENATE_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.concatOp, leftResult, rightResult, state)
      }
      case AstNodeType.EQUALS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.equalOp, leftResult, rightResult, state)
      }
      case AstNodeType.NOT_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.notEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.GREATER_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.greaterThanOp, leftResult, rightResult, state)
      }
      case AstNodeType.LESS_THAN_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.lessThanOp, leftResult, rightResult, state)
      }
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.greaterThanOrEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.LESS_THAN_OR_EQUAL_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.lessThanOrEqualOp, leftResult, rightResult, state)
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.plusOp, leftResult, rightResult, state)
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.minusOp, leftResult, rightResult, state)
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.timesOp, leftResult, rightResult, state)
      }
      case AstNodeType.POWER_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.powerOp, leftResult, rightResult, state)
      }
      case AstNodeType.DIV_OP: {
        const leftResult = this.evaluateAst(ast.left, state)
        const rightResult = this.evaluateAst(ast.right, state)
        return this.binaryAsyncRangeWrapper(this.divOp, leftResult, rightResult, state)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryAsyncRangeWrapper(this.unaryPlusOp, result, state)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryAsyncRangeWrapper(this.unaryMinusOp, result, state)
      }
      case AstNodeType.PERCENT_OP: {
        const result = this.evaluateAst(ast.value, state)
        return this.unaryAsyncRangeWrapper(this.percentOp, result, state)
      }
      case AstNodeType.FUNCTION_CALL: {
        if (this.config.licenseKeyValidityState !== LicenseKeyValidityState.VALID && !FunctionRegistry.functionIsProtected(ast.procedureName)) {
          return [new CellError(ErrorType.LIC, ErrorMessage.LicenseKey(this.config.licenseKeyValidityState))]
        }
    
        const interpreterState = new InterpreterState(state.formulaAddress, state.arraysFlag || this.functionRegistry.isArrayFunction(ast.procedureName), state.formulaVertex)
        const cellError = new CellError(ErrorType.NAME, ErrorMessage.FunctionName(ast.procedureName))
    
        const metadata = this.functionRegistry.getMetadata(ast.procedureName)

        if (metadata?.isAsyncMethod) {
          const pluginFunction = this.functionRegistry.getAsyncFunction(ast.procedureName)

          if (pluginFunction === undefined) {
            return [cellError]
          }

          const getPromise = () => new Promise<InterpreterValue>((resolve, reject) => {
            const pluginFunctionValue = pluginFunction(ast, interpreterState)
            const functionPromise = withTimeout(pluginFunctionValue, this.config.timeoutTime)

            functionPromise.then((interpreterValue) => {
              resolve(interpreterValue)
            }).catch((error) => {
              if (error instanceof CellError) {
                resolve(error)
              } else {
                reject(error)
              }
            })
          })

          const asyncVertex = state.formulaVertex

          if (asyncVertex) {
            asyncVertex.getPromise = getPromise
          }
          
          return [new CellError(ErrorType.LOADING, ErrorMessage.FunctionLoading), {
            asyncVertex,
            getPromise
          }]
        }

        const pluginFunction = this.functionRegistry.getFunction(ast.procedureName)

        if (pluginFunction === undefined) {
          return [cellError]
        }

        const pluginFunctionValue = pluginFunction(ast, interpreterState)
    
        return [pluginFunctionValue]
      }
      case AstNodeType.NAMED_EXPRESSION: {
        const namedExpression = this.namedExpressions.nearestNamedExpression(ast.expressionName, state.formulaAddress.sheet)
        if (namedExpression) {
          return [this.dependencyGraph.getCellValue(namedExpression.address)]
        } else {
          return [new CellError(ErrorType.NAME, ErrorMessage.NamedExpressionName(ast.expressionName))]
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return [new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)]
        }
        const range = AbsoluteCellRange.fromCellRange(ast, state.formulaAddress)
        const arrayVertex = this.dependencyGraph.getArray(range)
        if (arrayVertex) {
          const array = arrayVertex.array
          if (array instanceof NotComputedArray) {
            throw new Error('Array should be already computed')
          } else if (array instanceof CellError) {
            return [array]
          } else if (array instanceof ArrayValue) {
            return [SimpleRangeValue.fromRange(array.raw(), range, this.dependencyGraph)]
          } else {
            throw new Error('Unknown array')
          }
        } else {
          return [SimpleRangeValue.onlyRange(range, this.dependencyGraph)]
        }
      }
      case AstNodeType.COLUMN_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return [new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)]
        }
        const range = AbsoluteColumnRange.fromColumnRange(ast, state.formulaAddress)
        return [SimpleRangeValue.onlyRange(range, this.dependencyGraph)]
      }
      case AstNodeType.ROW_RANGE: {
        if (!this.rangeSpansOneSheet(ast)) {
          return [new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)]
        }
        const range = AbsoluteRowRange.fromRowRangeAst(ast, state.formulaAddress)
        return [SimpleRangeValue.onlyRange(range, this.dependencyGraph)]
      }
      case AstNodeType.PARENTHESIS: {
        return this.evaluateAst(ast.expression, state)
      }
      case AstNodeType.ARRAY: {
        const interpreterValues: InterpreterValue[][] = []
        const asyncPromiseVertices: AsyncPromiseVertex[][] = []

        for (let outerIndex = 0; outerIndex < ast.args.length; outerIndex++) {
          const astRow = ast.args[outerIndex]
          const rowRet: InterpreterValue[] = []
          const asyncPromiseValueRowRet: AsyncPromiseVertex[] = []
          
          for (let innerIndex = 0; innerIndex < astRow.length; innerIndex++) {
            const astIt = astRow[innerIndex]
            const [value, asyncPromiseVertex] = this.evaluateAst(astIt, state)

            if (asyncPromiseVertex) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const promiseGetter = asyncPromiseVertex.getPromise!

              const getPromise = () => new Promise<InterpreterValue>((resolve, reject) => {
                promiseGetter().then((interpreterValue) => {
                  resolve(interpreterValue)
                }).catch(reject)
              })

              const newAsyncPromiseVertex = {
                asyncVertex: asyncPromiseVertex.asyncVertex,
                getPromise
              }

              asyncPromiseValueRowRet[innerIndex] = newAsyncPromiseVertex
            }

            rowRet.push(value)
          }
          interpreterValues.push(rowRet)

          if (asyncPromiseValueRowRet.length) {
            asyncPromiseVertices[outerIndex] = asyncPromiseValueRowRet
          }
        }
        
        const getPromise = () => new Promise<InterpreterValue>((resolve, reject) => {
          const asyncInterpreterValuePromises: Promise<InterpreterValue[]>[] = []

          asyncPromiseVertices.forEach((asyncPromiseVertexRow, outerIndex) => {
            const asyncPromiseValueRowRet: AsyncInterpreterValue[] = []

            asyncPromiseVertexRow.forEach((vertex, innerIndex) => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              asyncPromiseValueRowRet[innerIndex] = vertex.getPromise!()
            })

            const promise = Promise.all(asyncPromiseValueRowRet)

            asyncInterpreterValuePromises[outerIndex] = promise
          })

          const interpreterValuePromises = Promise.all(asyncInterpreterValuePromises)

          interpreterValuePromises.then((values) => {
            const newInterpreterValues = [...interpreterValues]

            values.forEach((valueRow, outerIndex) => {
              valueRow.forEach((value, innerIndex) => {
                if (value !== undefined) {
                  newInterpreterValues[outerIndex][innerIndex] = value
                }
              })
            })
            
            const simpleRangeValues = this.getSimpleRangeValues(newInterpreterValues)

            if (simpleRangeValues instanceof CellError) {
              resolve(simpleRangeValues)
              return
            }

            resolve(SimpleRangeValue.onlyValues(simpleRangeValues))
          }).catch(reject)
        })

        const asyncPromiseVertex: AsyncPromiseVertex = {
          asyncVertex: state.formulaVertex,
          getPromise
        }

        const simpleRangeValues = this.getSimpleRangeValues(interpreterValues)

        if (simpleRangeValues instanceof CellError) {
          return [simpleRangeValues, asyncPromiseVertex]
        }

        return [SimpleRangeValue.onlyValues(simpleRangeValues), asyncPromiseVertex]
      }
      case AstNodeType.ERROR_WITH_RAW_INPUT:
      case AstNodeType.ERROR: {
        return [ast.error]
      }
    }
  }

  private getSimpleRangeValues(interpreterValues: InterpreterValue[][]): InternalScalarValue[][] | CellError {
    const ret: InternalScalarValue[][] = []
    let totalWidth: Maybe<number> = undefined

    for (const interpreterValueRow of interpreterValues) {
      let rowHeight: Maybe<number> = undefined
      const rowRet: InternalScalarValue[][] = []

      for (const interpreterValue of interpreterValueRow) {
        const simpleRangeValue = coerceToRange(interpreterValue)
        const height = simpleRangeValue.height()

        if (rowHeight === undefined) {
          rowHeight = height
          rowRet.push(...simpleRangeValue.data)
        } else if (rowHeight === height) {
          for (let i = 0; i < height; i++) {
            rowRet[i].push(...simpleRangeValue.data[i])
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

    return ret
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

  private unaryAsyncRangeWrapper(op: (arg: InternalScalarValue) => InternalScalarValue, arg: OptionalInterpreterTuple, state: InterpreterState): OptionalInterpreterTuple {
    const getValue = (arg: InterpreterValue) => this.unaryRangeWrapper(op, arg, state)
    const value = getValue(arg[0])
    const asyncArg = arg[1]

    if (asyncArg === undefined) {
      return [value]
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const getPromise1 = asyncArg.getPromise!

    const getPromise = () => new Promise<InterpreterValue>((resolve, reject) => {
      getPromise1().then((value) => {
        const interpreterValue = getValue(value)

        resolve(interpreterValue)
      }).catch(reject)
    })

    asyncArg.getPromise = getPromise

    return [value, asyncArg]
  }

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

  private binaryAsyncRangeWrapper(op: (arg1: InternalScalarValue, arg2: InternalScalarValue) => InternalScalarValue, arg1: OptionalInterpreterTuple, arg2: OptionalInterpreterTuple, state: InterpreterState): OptionalInterpreterTuple {
    const getValue = (arg1: InterpreterValue, arg2: InterpreterValue) => this.binaryRangeWrapper(op, arg1, arg2, state)
    const value = getValue(arg1[0], arg2[0])
    const asyncArg1 = arg1[1]
    const asyncArg2 = arg2[1]
    const getPromise1 = asyncArg1?.getPromise ? asyncArg1.getPromise : () => undefined
    const getPromise2 = asyncArg2?.getPromise ? asyncArg2.getPromise : () => undefined

    if (asyncArg1 === undefined && asyncArg2 === undefined) {
      return [value]
    }

    const getPromise = () => new Promise<InterpreterValue>((resolve, reject) => {  
      const promise1 = getPromise1()
      const promise2 = getPromise2()

      Promise.all([promise1, promise2]).then(([leftValue, rightValue]) => {
        const arg1AsyncVertex = arg1[1]?.asyncVertex as FormulaVertex | undefined
        const arg2AsyncVertex = arg2[1]?.asyncVertex as FormulaVertex | undefined

        const interpreterValue = getValue(leftValue ?? arg1AsyncVertex?.getCellValue() ?? arg1[0], rightValue ?? arg2AsyncVertex?.getCellValue() ?? arg2[0])

        resolve(interpreterValue)
      }).catch(reject)
    })

    const asyncPromiseVertex: AsyncPromiseVertex = {
      getPromise,
      asyncVertex: state.formulaVertex
    }

    return [value, asyncPromiseVertex]
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

