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
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'
import {ColumnRangeAst, RowRangeAst} from '../../parser/Ast'

export type BinaryOperation<T> = (left: T, right: T) => T

export type MapOperation<T> = (arg: number) => T

type coercionOperation = (arg: InternalScalarValue) => Maybe<number>

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
    'COUNTBLANK': {
      method: 'countblank',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
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
    return this.reduce(ast, formulaAddress, 0, 'SUM', (left,right) => left+right, idMap, this.strictlyNumbers)
  }

  public sumsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    return this.reduce(ast, formulaAddress, 0, 'SUMSQ', (left, right) => left+right, (arg) => arg*arg, this.strictlyNumbers)
  }

  public countblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COUNTBLANK'), (...args: InternalScalarValue[]) => {
      let counter = 0
      args.forEach((arg) => {
        if(arg === EmptyValue) {
          counter++
        }
      })
      return counter
    })
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
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MAX', Math.max, idMap, this.strictlyNumbers)

    return zeroForInfinite(value)
  }

  public maxa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MAXA', Math.max, idMap, this.numbersBooleans)

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
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MIN', Math.min, idMap, this.strictlyNumbers)

    return zeroForInfinite(value)
  }

  public mina(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MINA', Math.min, idMap, this.numbersBooleans)

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
      this.strictlyNumbers
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
     this.numbersBooleans
    )

    if (result instanceof CellError) {
      return result
    } else {
      return result.averageValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  private strictlyNumbers = (arg: InternalScalarValue): Maybe<number> => {
    if(typeof arg === 'number') {
      return arg
    } else {
      return undefined
    }
  }

  private numbersBooleans = (arg: InternalScalarValue): Maybe<number> => {
    if(typeof arg === 'boolean') {
      return coerceBooleanToNumber(arg)
    } else if(typeof arg === 'number') {
      return arg
    } else {
      return undefined
    }
  }

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
      let value
      if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
        value = this.evaluateRange(arg, formulaAddress, acc, functionName, reducingFunction, mapFunction, coercionFunction)
        if(value instanceof CellError) {
          return value
        }
      } else {
        value = this.evaluateAst(arg, formulaAddress)
        if (value instanceof SimpleRangeValue) {
          value = (Array.from(value.valuesFromTopLeftCorner())
            .map(coercionFunction)
            .filter((arg) => (arg !== undefined)) as number[])
            .map(mapFunction)
            .reduce(reducingFunction,initialAccValue)
        } else if (arg.type === AstNodeType.CELL_REFERENCE) {
          value = coercionFunction(value)
          if (value === undefined) {
            return acc
          }
          value = mapFunction(value)
        } else {
          value = this.coerceScalarToNumberOrError(value)
          if(value instanceof CellError) {
            return value
          }
          value = mapFunction(value)
        }

      }

      return reducingFunction(acc, value)
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
    const rangeResult: T[] = []
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
          if(val !== undefined) {
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
      if(val !== undefined) {
        rangeResult.push(mapFunction(val))
      }
    }

    return rangeResult
  }
}
