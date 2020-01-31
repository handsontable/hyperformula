import assert from 'assert'
import {AbsoluteCellRange, DIFFERENT_SHEETS_ERROR} from '../../AbsoluteCellRange'
import {CellError, InternalCellValue, EmptyValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser'
import {coerceNonDateScalarToMaybeNumber, coerceToRange} from '../coerce'
import { SimpleRangeValue} from '../InterpreterValue'
import {nonstrictadd, max, maxa, min, mina} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import {findSmallerRange} from './SumprodPlugin'

export type BinaryOperation<T> = (left: T, right: T) => T

export type MapOperation<T> = (arg: InternalCellValue) => T

function idMap(arg: InternalCellValue): InternalCellValue {
  return arg
}

function square(arg: InternalCellValue): InternalCellValue {
  if (arg instanceof CellError) {
    return arg
  } else if (typeof arg === 'number') {
    return arg * arg
  } else {
    return 0
  }
}

function zeroForInfinite(value: InternalCellValue) {
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
  ) { }

  public compose(other: AverageResult) {
    return new AverageResult(this.sum + other.sum, this.count + other.count)
  }

  public averageValue(): number | undefined {
    if (this.count > 0) {
      return this.sum / this.count
    } else {
      return undefined
    }
  }
}

export class NumericAggregationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sum: {
      translationKey: 'SUM',
    },
    sumsq: {
      translationKey: 'SUMSQ',
    },
    max: {
      translationKey: 'MAX',
    },
    min: {
      translationKey: 'MIN',
    },
    maxa: {
      translationKey: 'MAXA',
    },
    mina: {
      translationKey: 'MINA',
    },
    countblank: {
      translationKey: 'COUNTBLANK',
    },
    count: {
      translationKey: 'COUNT',
    },
    counta: {
      translationKey: 'COUNTA',
    },
    average: {
      translationKey: 'AVERAGE',
    },
    averagea: {
      translationKey: 'AVERAGEA',
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
  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.reduce(ast, formulaAddress, 0, 'SUM', nonstrictadd, idMap)
  }

  public sumsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    return this.reduce(ast, formulaAddress, 0, 'SUMSQ', nonstrictadd, square)
  }

  public countblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    let counter = 0
    for (const arg of ast.args) {
      const rangeValue = coerceToRange(this.evaluateAst(arg, formulaAddress))
      for (const value of rangeValue.valuesFromTopLeftCorner()) {
        if (value === EmptyValue) {
          counter++
        }
      }
    }
    return counter
  }

  /**
   * Corresponds to MAX(Number1, Number2, ...).
   *
   * Returns a max of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public max(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.NEGATIVE_INFINITY, 'MAX', max, idMap)

    return zeroForInfinite(value)
  }

  public maxa(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.NEGATIVE_INFINITY, 'MAXA', maxa, idMap)

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
  public min(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MIN', min, idMap)

    return zeroForInfinite(value)
  }

  public mina(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MINA', mina, idMap)

    return zeroForInfinite(value)
  }

  public count(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, 0, 'COUNT', (left, right) => {
      return left + right
    }, (arg): number => {
      return (typeof arg === 'number') ? 1 : 0
    })

    return value
  }

  public counta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, 0, 'COUNTA', (left, right) => {
      return left + right
    }, (arg): number => {
      return (arg === EmptyValue) ? 0 : 1
    })

    return value
  }

  public average(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    const result = this.reduce<AverageResult | CellError>(ast, formulaAddress, AverageResult.empty, 'AVERAGE', (left, right) => {
      if (left instanceof CellError) {
        return left
      } else if (right instanceof CellError) {
        return right
      } else {
        return left.compose(right)
      }
    }, (arg): AverageResult | CellError => {
      if (arg instanceof CellError) {
        return arg
      } else if (typeof arg === 'number') {
        return AverageResult.single(arg)
      } else {
        return AverageResult.empty
      }
    })

    if (result instanceof CellError) {
      return result
    } else {
      return result.averageValue() || new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  public averagea(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    const result = this.reduce<AverageResult | CellError>(ast, formulaAddress, AverageResult.empty, 'AVERAGE', (left, right) => {
      if (left instanceof CellError) {
        return left
      } else if (right instanceof CellError) {
        return right
      } else {
        return left.compose(right)
      }
    }, (arg): AverageResult | CellError => {
      if (arg === EmptyValue) {
        return AverageResult.empty
      } else {
        const coercedArg = coerceNonDateScalarToMaybeNumber(arg)
        if (coercedArg === null) {
          return AverageResult.empty
        } else if (coercedArg instanceof CellError) {
          return coercedArg
        } else {
          return AverageResult.single(coercedArg)
        }
      }
    })

    if (result instanceof CellError) {
      return result
    } else {
      return result.averageValue() || new CellError(ErrorType.DIV_BY_ZERO)
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
   * */
  private reduce<T>(ast: ProcedureAst, formulaAddress: SimpleCellAddress, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>): T {
    return ast.args.reduce((acc: T, arg) => {
      let value
      if (arg.type === AstNodeType.CELL_RANGE) {
        value = this.evaluateRange(arg, formulaAddress, acc, functionName, reducingFunction, mapFunction)
      } else {
        value = this.evaluateAst(arg, formulaAddress)
        if (value instanceof SimpleRangeValue) {
          value = this.reduceRange(Array.from(value.valuesFromTopLeftCorner()).map(mapFunction), initialAccValue, reducingFunction)
        } else {
          value = mapFunction(value)
        }
      }

      return reducingFunction(acc, value)
    }, initialAccValue)
  }

  /**
   * Reduces list of cell values with given reducing function
   *
   * @param rangeValues - list of values to reduce
   * @param initialAccValue - initial accumulator value for reducing function
   * @param reducingFunction - reducing function
   */
  private reduceRange<T>(rangeValues: T[], initialAccValue: T, reducingFunction: BinaryOperation<T>): T {
    let acc = initialAccValue
    for (const val of rangeValues) {
      acc = reducingFunction(acc, val)
    }
    return acc
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
  private evaluateRange<T>(ast: CellRangeAst, formulaAddress: SimpleCellAddress, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>): T {
    let range
    try {
      range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
    } catch (err) {
      if (err.message === DIFFERENT_SHEETS_ERROR) {
        return mapFunction(new CellError(ErrorType.VALUE))
      } else {
        throw err
      }
    }
    const rangeStart = ast.start.toSimpleCellAddress(formulaAddress)
    const rangeEnd = ast.end.toSimpleCellAddress(formulaAddress)
    const rangeVertex = this.dependencyGraph.getRange(rangeStart, rangeEnd)!
    assert.ok(rangeVertex, 'Range does not exists in graph')

    let value = rangeVertex.getFunctionValue(functionName) as T
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, range, mapFunction)
      value = this.reduceRange(rangeValues, initialAccValue, reducingFunction)
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
  private getRangeValues<T>(functionName: string, range: AbsoluteCellRange, mapFunction: MapOperation<T>): T[] {
    const rangeResult: T[] = []
    const {smallerRangeVertex, restRanges} = findSmallerRange(this.dependencyGraph, [range])
    const restRange = restRanges[0]
    const currentRangeVertex = this.dependencyGraph.getRange(range.start, range.end)!
    if (smallerRangeVertex && this.dependencyGraph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      const cachedValue: T = smallerRangeVertex.getFunctionValue(functionName) as T
      if (cachedValue) {
        rangeResult.push(cachedValue)
      } else {
        for (const cellFromRange of smallerRangeVertex.range.addresses()) {
          rangeResult.push(mapFunction(this.dependencyGraph.getCellValue(cellFromRange)))
        }
      }
    }
    for (const cellFromRange of restRange.addresses()) {
      rangeResult.push(mapFunction(this.dependencyGraph.getCellValue(cellFromRange)))
    }

    return rangeResult
  }
}
