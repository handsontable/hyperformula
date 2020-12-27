/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import assert from 'assert'
import {AbsoluteCellRange, DIFFERENT_SHEETS_ERROR} from '../../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from '../../parser'
import {ColumnRangeAst, RowRangeAst} from '../../parser/Ast'
import {coerceBooleanToNumber} from '../ArithmeticHelper'
import {
  EmptyValue,
  RichNumber,
  InternalScalarValue, isExtendedNumber, getRawValue, ExtendedNumber,
} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export type BinaryOperation<T> = (left: T, right: T) => T

export type MapOperation<T> = (arg: ExtendedNumber) => T

type coercionOperation = (arg: InternalScalarValue) => Maybe<ExtendedNumber | CellError>

function identityMap<T>(arg: T): T {
  return arg
}

function zeroForInfinite(value: InternalScalarValue) {
  if (isExtendedNumber(value) && !Number.isFinite(getRawValue(value))) {
    return 0
  } else {
    return value
  }
}

class MomentsAggregate {

  public static empty = new MomentsAggregate(0, 0, 0)

  public static single(arg: number): MomentsAggregate {
    return new MomentsAggregate(arg*arg, arg, 1)
  }

  constructor(
    public readonly sumsq: number,
    public readonly sum: number,
    public readonly count: number,
  ) {
  }

  public compose(other: MomentsAggregate) {
    return new MomentsAggregate(this.sumsq + other.sumsq, this.sum + other.sum, this.count + other.count)
  }

  public averageValue(): Maybe<number> {
    if (this.count > 0) {
      return this.sum / this.count
    } else {
      return undefined
    }
  }

  public varSValue(): Maybe<number> {
    if(this.count > 1) {
      return (this.sumsq - (this.sum*this.sum)/this.count)/(this.count-1)
    } else {
      return undefined
    }
  }

  public varPValue(): Maybe<number> {
    if(this.count > 0) {
      return (this.sumsq - (this.sum*this.sum)/this.count)/this.count
    } else {
      return undefined
    }
  }
}

export class NumericAggregationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'SUM': {
      method: 'sum',
    },
    'SUMSQ': {
      method: 'sumsq',
    },
    'MAX': {
      method: 'max',
    },
    'MIN': {
      method: 'min',
    },
    'MAXA': {
      method: 'maxa',
    },
    'MINA': {
      method: 'mina',
    },
    'COUNT': {
      method: 'count',
    },
    'COUNTA': {
      method: 'counta',
    },
    'AVERAGE': {
      method: 'average',
    },
    'AVERAGEA': {
      method: 'averagea',
    },
    'PRODUCT': {
      method: 'product',
    },
    'VAR.S': {
      method: 'vars',
    },
    'VAR.P': {
      method: 'varp',
    },
    'VARA': {
      method: 'vara',
    },
    'VARPA': {
      method: 'varpa',
    },
    'STDEV.S': {
      method: 'stdevs',
    },
    'STDEV.P': {
      method: 'stdevp',
    },
    'STDEVA': {
      method: 'stdeva',
    },
    'STDEVPA': {
      method: 'stdevpa',
    },
    'SUBTOTAL': {
      method: 'subtotal',
    }
  }

  public static aliases = {
    VAR: 'VAR.S',
    VARP: 'VAR.P',
    STDEV: 'STDEV.S',
    STDEVP: 'STDEV.P',
    VARS: 'VAR.S',
    STDEVS: 'STDEV.S',
  }

  /**
   * Corresponds to SUM(Number1, Number2, ...).
   *
   * Returns a sum of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doSum(ast.args, formulaAddress)
  }

  public sumsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.reduce(ast.args, formulaAddress, 0, 'SUMSQ', this.addWithEpsilon, (arg: ExtendedNumber) => Math.pow(getRawValue(arg),2), strictlyNumbers)
  }

  /**
   * Corresponds to MAX(Number1, Number2, ...).
   *
   * Returns a max of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public max(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doMax(ast.args, formulaAddress)
  }

  public maxa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(ast.args, formulaAddress, Number.NEGATIVE_INFINITY, 'MAXA',
      (left, right) => Math.max(left, right),
      identityMap, numbersBooleans)

    return zeroForInfinite(value)
  }

  /**
   * Corresponds to MIN(Number1, Number2, ...).
   *
   * Returns a min of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public min(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doMin(ast.args, formulaAddress)
  }

  public mina(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(ast.args, formulaAddress, new RegularNumber(Number.POSITIVE_INFINITY), 'MINA',
      (left, right) => new RegularNumber(Math.min(left.get(), right.get())),
      identityMap, numbersBooleans)

    return zeroForInfinite(value)
  }

  public count(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doCount(ast.args, formulaAddress)
  }

  public counta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doCounta(ast.args, formulaAddress)
  }

  public average(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doAverage(ast.args, formulaAddress)
  }

  public averagea(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduce<MomentsAggregate>(ast.args, formulaAddress, MomentsAggregate.empty, '_AGGREGATE_A',
      (left, right) => left.compose(right),
      (arg): MomentsAggregate => MomentsAggregate.single(arg.get()),
      numbersBooleans
    )

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.averageValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  public vars(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doVarS(ast.args, formulaAddress)
  }

  public varp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doVarP(ast.args, formulaAddress)
  }

  public vara(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  public varpa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  public stdevs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doStdevS(ast.args, formulaAddress)
  }

  public stdevp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doStdevP(ast.args, formulaAddress)
  }

  public stdeva(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(Math.sqrt(val))
    }
  }

  public stdevpa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(Math.sqrt(val))
    }
  }

  public product(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.doProduct(ast.args, formulaAddress)
  }

  public subtotal(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const functionType = this.coerceToType(this.evaluateAst(ast.args[0], formulaAddress), {argumentType: ArgumentTypes.NUMBER})
    const args = ast.args.slice(1)
    switch (functionType) {
      case 1:
      case 101:
        return this.doAverage(args, formulaAddress)
      case 2:
      case 102:
        return this.doCount(args, formulaAddress)
      case 3:
      case 103:
        return this.doCounta(args, formulaAddress)
      case 4:
      case 104:
        return this.doMax(args, formulaAddress)
      case 5:
      case 105:
        return this.doMin(args, formulaAddress)
      case 6:
      case 106:
        return this.doProduct(args, formulaAddress)
      case 7:
      case 107:
        return this.doStdevS(args, formulaAddress)
      case 8:
      case 108:
        return this.doStdevP(args, formulaAddress)
      case 9:
      case 109:
        return this.doSum(args, formulaAddress)
      case 10:
      case 110:
        return this.doVarS(args, formulaAddress)
      case 11:
      case 111:
        return this.doVarP(args, formulaAddress)
      default:
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
    }
  }

  private reduceAggregate(args: Ast[], formulaAddress: SimpleCellAddress): MomentsAggregate | CellError{
    return this.reduce<MomentsAggregate>(args, formulaAddress, MomentsAggregate.empty, '_AGGREGATE', (left, right) => {
        return left.compose(right)
      }, (arg): MomentsAggregate => {
        return MomentsAggregate.single(arg.get())
      },
      strictlyNumbers
    )
  }

  private reduceAggregateA(args: Ast[], formulaAddress: SimpleCellAddress): MomentsAggregate | CellError{
    return this.reduce<MomentsAggregate>(args, formulaAddress, MomentsAggregate.empty, '_AGGREGATE_A', (left, right) => {
        return left.compose(right)
      }, (arg): MomentsAggregate => {
        return MomentsAggregate.single(arg.get())
      },
      numbersBooleans
    )
  }

  private doAverage(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregate(args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.averageValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  private doVarS(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregate(args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  private doVarP(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregate(args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(val)
    }
  }

  private doStdevS(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregate(args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(Math.sqrt(val))
    }
  }

  private doStdevP(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const result = this.reduceAggregate(args, formulaAddress)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined  ? new CellError(ErrorType.DIV_BY_ZERO) : new RegularNumber(Math.sqrt(val))
    }
  }

  private doCount(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(args, formulaAddress, new RegularNumber(0), 'COUNT',
      (left, right) => new RegularNumber(left.get() + right.get()), identityMap,
      (arg) => new RegularNumber((arg instanceof RichNumber) ? 1 : 0)
    )

    return value
  }

  private doCounta(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(args, formulaAddress, new RegularNumber(0), 'COUNTA', (left, right) => new RegularNumber(left.get() + right.get()),
      identityMap,
      (arg) => new RegularNumber((arg === EmptyValue) ? 0 : 1)
    )

    return value
  }

  private doMax(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(args, formulaAddress, new RegularNumber(Number.NEGATIVE_INFINITY), 'MAX',
      (left, right) => new RegularNumber(Math.max(left.get(), right.get())),
      identityMap, strictlyNumbers
    )

    return zeroForInfinite(value)
  }

  private doMin(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    const value = this.reduce(args, formulaAddress, new RegularNumber(Number.POSITIVE_INFINITY), 'MIN',
      (left, right) => new RegularNumber(Math.min(left.get(), right.get())),
      identityMap, strictlyNumbers
    )

    return zeroForInfinite(value)
  }

  private doSum(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.reduce(args, formulaAddress, new RegularNumber(0), 'SUM', this.addWithEpsilon, identityMap, strictlyNumbers)
  }

  private doProduct(args: Ast[], formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.reduce(args, formulaAddress, new RegularNumber(1), 'PRODUCT', (left, right) => new RegularNumber(left.get() * right.get()), identityMap, strictlyNumbers)
  }

  private addWithEpsilon = (left: ExtendedNumber, right: ExtendedNumber): ExtendedNumber => this.interpreter.arithmeticHelper.addWithEpsilon(left, right)

  /**
   * Reduces procedure arguments with given reducing function
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param initialAccValue - initial accumulator value for reducing function
   * @param functionName - function name to use as cache key
   * @param reducingFunction - reducing function
   * @param mapFunction
   * @param coerceFunction
   * */
  private reduce<T>(args: Ast[], formulaAddress: SimpleCellAddress, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): CellError | T {
    if (args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    return args.reduce((acc: T | CellError, arg) => {
      if (acc instanceof CellError) {
        return acc
      }
      if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
        return this.evaluateRange(arg, formulaAddress, acc, functionName, reducingFunction, mapFunction, coercionFunction)
      }
      let value
      value = this.evaluateAst(arg, formulaAddress)
      if (value instanceof SimpleRangeValue) {
        const coercedRangeValues = Array.from(value.valuesFromTopLeftCorner())
          .map(coercionFunction)
          .filter((arg) => (arg !== undefined)) as (CellError | number)[]

        return coercedRangeValues
          .map((arg) => {
            if (arg instanceof CellError) {
              return arg
            } else {
              return mapFunction(arg)
            }
          })
          .reduce((left, right) => {
            if (left instanceof CellError) {
              return left
            } else if (right instanceof CellError) {
              return right
            } else {
              return reducingFunction(left, right)
            }
          }, acc)
      } else if (arg.type === AstNodeType.CELL_REFERENCE) {
        value = coercionFunction(value)
        if (value === undefined) {
          return acc
        }
      } else {
        value = this.coerceScalarToNumberOrError(value)
        value = coercionFunction(value)
        if (value === undefined) {
          return acc
        }
      }

      if (value instanceof CellError) {
        return value
      }

      return reducingFunction(acc, mapFunction(value))
    }, initialAccValue)
  }

  /**
   * Performs range operation on given range
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param initialAccValue - initial accumulator value for reducing function
   * @param functionName - function name to use as cache key
   * @param reducingFunction - reducing function
   */
  private evaluateRange<T>(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, formulaAddress: SimpleCellAddress, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): T | CellError {
    let range
    try {
      range = AbsoluteCellRange.fromAst(ast, formulaAddress)
    } catch (err) {
      if (err.message === DIFFERENT_SHEETS_ERROR) {
        return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
      } else {
        throw err
      }
    }

    const rangeStart = range.start
    const rangeEnd = range.end
    const rangeVertex = this.dependencyGraph.getRange(rangeStart, rangeEnd)!
    assert.ok(rangeVertex, 'Range does not exists in graph')

    let value = rangeVertex.getFunctionValue(functionName) as (T | CellError)
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, range, mapFunction, coercionFunction)
      value = rangeValues.reduce((arg1, arg2) => {
        if (arg1 instanceof CellError) {
          return arg1
        } else if (arg2 instanceof CellError) {
          return arg2
        } else {
          return reducingFunction(arg1, arg2)
        }
      }, initialAccValue)
      rangeVertex.setFunctionValue(functionName, value)
    }

    return value
  }

  /**
   * Returns list of values for given range and function name
   *
   * If range is dependent on smaller range, list will contain value of smaller range for this function
   * and values of cells that are not present in smaller range
   *
   * @param functionName - function name (e.g. SUM)
   * @param range - cell range
   */
  private getRangeValues<T>(functionName: string, range: AbsoluteCellRange, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): (T | CellError)[] {
    const rangeResult: (T | CellError)[] = []
    const {smallerRangeVertex, restRange} = this.dependencyGraph.rangeMapping.findSmallerRange(range)
    const currentRangeVertex = this.dependencyGraph.getRange(range.start, range.end)!
    let actualRange: AbsoluteCellRange
    if (smallerRangeVertex && this.dependencyGraph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      const cachedValue: T = smallerRangeVertex.getFunctionValue(functionName) as T
      if (cachedValue) {
        rangeResult.push(cachedValue)
      } else {
        for (const cellFromRange of smallerRangeVertex.range.addresses(this.dependencyGraph)) {
          const val = coercionFunction(this.dependencyGraph.getScalarValue(cellFromRange))
          if (val instanceof CellError) {
            rangeResult.push(val)
          } else if (val !== undefined) {
            rangeResult.push(mapFunction(val))
          }
        }
      }
      actualRange = restRange
    } else {
      actualRange = range
    }
    for (const cellFromRange of actualRange.addresses(this.dependencyGraph)) {
      const val = coercionFunction(this.dependencyGraph.getScalarValue(cellFromRange))
      if (val instanceof CellError) {
        rangeResult.push(val)
      } else if (val !== undefined) {
        rangeResult.push(mapFunction(val))
      }
    }

    return rangeResult
  }
}

function strictlyNumbers(arg: InternalScalarValue): Maybe<CellError | RichNumber> {
  if (arg instanceof RichNumber || arg instanceof CellError) {
    return arg
  } else {
    return undefined
  }
}

function numbersBooleans(arg: InternalScalarValue): Maybe<CellError | RichNumber> {
  if (arg instanceof ExtendedBoolean) {
    return coerceBooleanToNumber(arg)
  } else if (arg instanceof RichNumber || arg instanceof CellError) {
    return arg
  } else if (arg instanceof ExtendedString) {
    return new RegularNumber(0)
  } else {
    return undefined
  }
}

