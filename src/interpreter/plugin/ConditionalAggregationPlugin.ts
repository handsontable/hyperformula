/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {Condition, CriterionFunctionCompute} from '../CriterionFunctionCompute'
import {InterpreterState} from '../InterpreterState'
import {
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
  RawInterpreterValue,
  RawScalarValue
} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

class AverageResult {
  public static empty = new AverageResult(0, 0)

  constructor(
    public readonly sum: number,
    public readonly count: number,
  ) {}

  public static single(arg: number): AverageResult {
    return new AverageResult(arg, 1)
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

/** Computes key for criterion function cache */
function conditionalAggregationFunctionCacheKey(functionName: string): (conditions: Condition[]) => string {
  return (conditions: Condition[]): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const conditionsStrings = conditions.map((c) => `${c.conditionRange.range!.sheet},${c.conditionRange.range!.start.col},${c.conditionRange.range!.start.row}`)
    return [functionName, ...conditionsStrings].join(',')
  }
}

function zeroForInfinite(value: InternalScalarValue) {
  if (isExtendedNumber(value) && !Number.isFinite(getRawValue(value))) {
    return 0
  } else {
    return value
  }
}

function mapToRawScalarValue(arg: InternalScalarValue): Maybe<CellError | RawScalarValue> {
  if (arg instanceof CellError) {
    return arg
  }

  if (isExtendedNumber(arg)) {
    return getRawValue(arg)
  }

  return undefined
}

export class ConditionalAggregationPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ConditionalAggregationPlugin> {
  public static implementedFunctions = {
    SUMIF: {
      method: 'sumif',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
        {argumentType: FunctionArgumentType.RANGE, optionalArg: true},
      ],
    },
    COUNTIF: {
      method: 'countif',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
      ],
    },
    AVERAGEIF: {
      method: 'averageif',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
        {argumentType: FunctionArgumentType.RANGE, optionalArg: true},
      ],
    },
    SUMIFS: {
      method: 'sumifs',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
      ],
      repeatLastArgs: 2,
    },
    COUNTIFS: {
      method: 'countifs',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
      ],
      repeatLastArgs: 2,
    },
    MINIFS: {
      method: 'minifs',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
      ],
      repeatLastArgs: 2,
    },
    MAXIFS: {
      method: 'maxifs',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NOERROR},
      ],
      repeatLastArgs: 2,
    },
  }

  /**
   * Corresponds to SUMIF(Range, Criterion, SumRange)
   *
   * Range is the range to which criterion is to be applied.
   * Criterion is the criteria used to choose which cells will be included in sum.
   * SumRange is the range on which adding will be performed.
   *
   * @param ast
   * @param state
   */
  public sumif(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'SUMIF'

    const computeFn = (
      conditionRange: SimpleRangeValue,
      criterion: RawScalarValue,
      values: Maybe<SimpleRangeValue>
    ) => this.computeConditionalAggregationFunction<RawScalarValue>(
      values ?? conditionRange,
      [conditionRange, criterion],
      functionName,
      0,
      (left, right) => this.arithmeticHelper.nonstrictadd(left, right),
      mapToRawScalarValue as (arg: InternalScalarValue) => RawScalarValue,
    )

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  public sumifs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'SUMIFS'

    const computeFn = (values: SimpleRangeValue, ...args: unknown[]) => this.computeConditionalAggregationFunction<RawScalarValue>(
      values,
      args as RawInterpreterValue[],
      functionName,
      0,
      (left, right) => this.arithmeticHelper.nonstrictadd(left, right),
      mapToRawScalarValue as (arg: InternalScalarValue) => RawScalarValue,
    )

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  public averageif(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'AVERAGEIF'

    const computeFn = (
      conditionRange: SimpleRangeValue,
      criterion: RawScalarValue,
      values: Maybe<SimpleRangeValue>
    ) => {
      const averageResult = this.computeConditionalAggregationFunction<AverageResult>(
        values ?? conditionRange,
        [conditionRange, criterion],
        functionName,
        AverageResult.empty,
        (left, right) => left.compose(right),
        (arg) => isExtendedNumber(arg) ? AverageResult.single(getRawValue(arg)) : AverageResult.empty,
        )

      if (averageResult instanceof CellError) {
        return averageResult
      } else {
        return averageResult.averageValue() || new CellError(ErrorType.DIV_BY_ZERO)
      }
    }

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  /**
   * Corresponds to COUNTIF(Range, Criterion)
   *
   * Range is the range to which criterion is to be applied.
   * Criterion is the criteria used to choose which cells will be included in sum.
   *
   * Returns number of cells on which criteria evaluate to true.
   *
   * @param ast
   * @param state
   */
  public countif(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'COUNTIF'

    const computeFn = (conditionRange: SimpleRangeValue, criterion: RawScalarValue) => this.computeConditionalAggregationFunction<number>(
      conditionRange,
      [conditionRange, criterion],
      functionName,
      0,
      (left, right) => left + right,
      () => 1,
    )

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  public countifs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'COUNTIFS'

    const computeFn = (...args: unknown[]) => this.computeConditionalAggregationFunction<number>(
      args[0] as SimpleRangeValue,
      args as RawInterpreterValue[],
      functionName,
      0,
      (left, right) => left + right,
      () => 1,
    )

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  public minifs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'MINIFS'

    const composeFunction = (left: RawScalarValue, right: RawScalarValue): RawScalarValue => {
      if (right === undefined || left === undefined) {
        return right === undefined ? left : right
      }

      return Math.min(left as number, right as number)
    }

    const computeFn = (values: SimpleRangeValue, ...args: unknown[]) => {
      const minResult = this.computeConditionalAggregationFunction<RawScalarValue>(
        values,
        args as RawInterpreterValue[],
        functionName,
        Number.POSITIVE_INFINITY,
        composeFunction,
        mapToRawScalarValue as (arg: InternalScalarValue) => RawScalarValue,
      )

      return zeroForInfinite(minResult)
    }

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  public maxifs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const functionName = 'MAXIFS'

    const composeFunction = (left: RawScalarValue, right: RawScalarValue): RawScalarValue => {
      if (right === undefined || left === undefined) {
        return right === undefined ? left : right
      }

      return Math.max(left as number, right as number)
    }

    const computeFn = (values: SimpleRangeValue, ...args: unknown[]) => {
      const maxResult = this.computeConditionalAggregationFunction<RawScalarValue>(
        values,
        args as RawInterpreterValue[],
        functionName,
        Number.NEGATIVE_INFINITY,
        composeFunction,
        mapToRawScalarValue as (arg: InternalScalarValue) => RawScalarValue,
      )

      return zeroForInfinite(maxResult)
    }

    return this.runFunction(ast.args, state, this.metadata(functionName), computeFn)
  }

  private computeConditionalAggregationFunction<T>(
    valuesRange: SimpleRangeValue,
    conditionArgs: RawInterpreterValue[],
    functionName: string,
    reduceInitialValue: T,
    composeFunction: (left: T, right: T) => T,
    mapFunction: (arg: InternalScalarValue) => T
  ): T | CellError {
    const conditions: Condition[] = []
    for (let i = 0; i < conditionArgs.length; i += 2) {
      const conditionArg = conditionArgs[i] as SimpleRangeValue
      const criterionPackage = this.interpreter.criterionBuilder.fromCellValue(conditionArgs[i + 1] as RawScalarValue, this.arithmeticHelper)
      if (criterionPackage === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
      }
      conditions.push(new Condition(conditionArg, criterionPackage))
    }

    return new CriterionFunctionCompute<T>(
      this.interpreter,
      conditionalAggregationFunctionCacheKey(functionName),
      reduceInitialValue,
      composeFunction,
      mapFunction,
    ).compute(valuesRange, conditions)
  }
}
