/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import assert from 'assert'
import {AbsoluteCellRange, DIFFERENT_SHEETS_ERROR} from '../../AbsoluteCellRange'
import {CellError, EmptyValue, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser'
import {coerceBooleanToNumber} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'
import {ColumnRangeAst, RowRangeAst} from '../../parser/Ast'

export type BinaryOperation<T> = (left: T, right: T) => T

export type MapOperation<T> = (arg: number) => T

type coercionOperation = (arg: InternalScalarValue) => Maybe<number | CellError>

function idMap(arg: number): number {
  return arg
}

function zeroForInfinite(value: InternalScalarValue) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 0
  } else {
    return value
  }
}

class AverageResult {

  public static empty = new AverageResult(0, 0)

  public static single(arg: number): AverageResult {
    return new AverageResult(arg, 1)
  }

  constructor(
    public readonly sum: number,
    public readonly count: number,
  ) {
  }

  public compose(other: AverageResult) {
    return new AverageResult(this.sum + other.sum, this.count + other.count)
  }

  public averageValue(): Maybe<number> {
    if (this.count > 0) {
      return this.sum / this.count
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
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    return this.reduce(ast, formulaAddress, 0, 'SUM', this.addWithEpsilon, idMap, strictlyNumbers)
  }

  public sumsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    return this.reduce(ast, formulaAddress, 0, 'SUMSQ', this.addWithEpsilon, (arg) => arg*arg, strictlyNumbers)
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
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.NEGATIVE_INFINITY, 'MAX',
      (left, right) => Math.max(left, right),
      idMap, strictlyNumbers)

    return zeroForInfinite(value)
  }

  public maxa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.NEGATIVE_INFINITY, 'MAXA',
      (left, right) => Math.max(left, right),
      idMap, numbersBooleans)

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
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MIN',
      (left, right) => Math.min(left, right),
      idMap, strictlyNumbers)

    return zeroForInfinite(value)
  }

  public mina(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MINA',
      (left, right) => Math.min(left, right),
      idMap, numbersBooleans)

    return zeroForInfinite(value)
  }

  public count(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, 0, 'COUNT',
      (left, right) => left + right, idMap,
      (arg)  => (typeof arg === 'number') ? 1 : 0
    )

    return value
  }

  public counta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, 0, 'COUNTA', (left, right) => left + right,
      idMap,
      (arg) => (arg === EmptyValue) ? 0 : 1
    )

    return value
  }

  public average(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const result = this.reduce<AverageResult>(ast, formulaAddress, AverageResult.empty, 'AVERAGE', (left, right) => {
        return left.compose(right)
    }, (arg): AverageResult => {
        return AverageResult.single(arg)
      },
      strictlyNumbers
    )

    if (result instanceof CellError) {
      return result
    } else {
      return result.averageValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  public averagea(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const result = this.reduce<AverageResult>(ast, formulaAddress, AverageResult.empty, 'AVERAGE',
      (left, right) => left.compose(right),
     (arg): AverageResult  => AverageResult.single(arg),
     numbersBooleans
    )

    if (result instanceof CellError) {
      return result
    } else {
      return result.averageValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  private addWithEpsilon = (left: number, right: number): number => this.interpreter.arithmeticHelper.addWithEpsilon(left, right)

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
  private reduce<T>(ast: ProcedureAst, formulaAddress: SimpleCellAddress, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): CellError | T {
    return ast.args.reduce((acc: T | CellError, arg) => {
      if(acc instanceof CellError) {
        return acc
      }
      if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
        return this.evaluateRange(arg, formulaAddress, acc, functionName, reducingFunction, mapFunction, coercionFunction)
      }
      let value
      value = this.evaluateAst(arg, formulaAddress)
      if (value instanceof SimpleRangeValue) {
        return (Array.from(value.valuesFromTopLeftCorner())
          .map(coercionFunction)
          .filter((arg) => (arg !== undefined)) as (CellError | number)[])
          .map((arg) => {
            if(arg instanceof CellError){
              return arg
            } else {
              return mapFunction(arg)
            }
          })
          .reduce((left, right) => {
            if(left instanceof CellError) {
              return left
            } else if(right instanceof CellError) {
              return right
            } else {
              return reducingFunction(left, right)
            }
          }, acc)
      }

      if (arg.type === AstNodeType.CELL_REFERENCE) {
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
      if(value instanceof CellError) {
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
      value = rangeValues.reduce( (arg1, arg2)  => {
        if(arg1 instanceof CellError) {
          return arg1
        } else if(arg2 instanceof CellError) {
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
          if(val instanceof CellError) {
            rangeResult.push(val)
          } else if(val !== undefined) {
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
      if(val instanceof CellError) {
        rangeResult.push(val)
      } else if(val !== undefined) {
        rangeResult.push(mapFunction(val))
      }
    }

    return rangeResult
  }
}

function strictlyNumbers(arg: InternalScalarValue): Maybe<CellError | number> {
  if(typeof arg === 'number' || arg instanceof CellError) {
    return arg
  } else {
    return undefined
  }
}

function numbersBooleans(arg: InternalScalarValue): Maybe<CellError | number> {
  if(typeof arg === 'boolean') {
    return coerceBooleanToNumber(arg)
  } else if(typeof arg === 'number' || arg instanceof CellError) {
    return arg
  } else if(typeof arg === 'string') {
    return 0
  } else {
    return undefined
  }
}

