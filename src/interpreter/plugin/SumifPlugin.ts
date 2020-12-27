/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {Condition, CriterionFunctionCompute} from '../CriterionFunctionCompute'
import {RichNumber, InternalScalarValue, RawScalarValue, RegularNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

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

/** Computes key for criterion function cache */
function sumifCacheKey(conditions: Condition[]): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['SUMIF', ...conditionsStrings].join(',')
}

function averageifCacheKey(conditions: Condition[]): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['AVERAGEIF', ...conditionsStrings].join(',')
}

function countifsCacheKey(conditions: Condition[]): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['COUNTIFS', ...conditionsStrings].join(',')
}

export class SumifPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'SUMIF': {
      method: 'sumif',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true},
      ],
    },
    'COUNTIF': {
      method: 'countif',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NOERROR},
      ],
    },
    'AVERAGEIF': {
      method: 'averageif',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true},
      ],
    },
    'SUMIFS': {
      method: 'sumifs',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NOERROR},
      ],
      repeatLastArgs: 2,
    },
    'COUNTIFS': {
      method: 'countifs',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NOERROR},
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
   * @param formulaAddress
   */
  public sumif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SUMIF'),
      (conditionArg: SimpleRangeValue, criterionValue: RawScalarValue, valuesArg: Maybe<SimpleRangeValue>) => {
        const criterion = this.interpreter.criterionBuilder.fromCellValue(criterionValue, this.interpreter.arithmeticHelper)
        if (criterion === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }

        valuesArg = valuesArg ?? conditionArg

        return  new CriterionFunctionCompute<RawScalarValue>(
          this.interpreter,
          sumifCacheKey,
          0,
          (left, right) => this.interpreter.arithmeticHelper.nonstrictadd(left, right),
          (arg) => arg,
        ).compute(valuesArg, [new Condition(conditionArg, criterion)])
      }
    )
  }

  public sumifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SUMIFS'), (values: SimpleRangeValue, ...args) => {
      const conditions: Condition[] = []
      for (let i = 0; i < args.length; i += 2) {
        const conditionArg = args[i] as SimpleRangeValue
        const criterionPackage = this.interpreter.criterionBuilder.fromCellValue(args[i+1], this.interpreter.arithmeticHelper)
        if (criterionPackage === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }
        conditions.push(new Condition(conditionArg, criterionPackage))
      }

      return new CriterionFunctionCompute<RawScalarValue>(
        this.interpreter,
        sumifCacheKey,
        0,
        (left, right) => this.interpreter.arithmeticHelper.nonstrictadd(left, right),
        (arg) => arg,
      ).compute(values, conditions)
    })
  }

  public averageif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('AVERAGEIF'),
      (conditionArg: SimpleRangeValue, criterionValue: RawScalarValue, valuesArg: Maybe<SimpleRangeValue>) => {
        const criterion = this.interpreter.criterionBuilder.fromCellValue(criterionValue, this.interpreter.arithmeticHelper)
        if (criterion === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }

        valuesArg = valuesArg ?? conditionArg

        const averageResult = new CriterionFunctionCompute<AverageResult>(
          this.interpreter,
          averageifCacheKey,
          AverageResult.empty,
          (left, right) => left.compose(right),
          (arg: RawScalarValue) => {
            if (arg instanceof RichNumber) {
              return AverageResult.single(arg.get())
            } else {
              return AverageResult.empty
            }
          },
        ).compute(valuesArg, [new Condition(conditionArg, criterion)])
        if (averageResult instanceof CellError) {
          return averageResult
        } else {
          return averageResult.averageValue() || new CellError(ErrorType.DIV_BY_ZERO)
        }
      }
    )
  }

  /**
   * Corresponds to COUNTIF(Range, Criterion)
   *
   * Range is the range to which criterion is to be applied.
   * Criterion is the criteria used to choose which cells will be included in sum.
   *
   * Returns number of cells on which criteria evaluates to true.
   *
   * @param ast
   * @param formulaAddress
   */
  public countif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COUNTIF'),
      (conditionArg: SimpleRangeValue, criterionValue: RawScalarValue) => {
        const criterion = this.interpreter.criterionBuilder.fromCellValue(criterionValue, this.interpreter.arithmeticHelper)
        if (criterion === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }

        return new CriterionFunctionCompute<number>(
          this.interpreter,
          () => 'COUNTIF',
          0,
          (left, right) => left + right,
          () => 1,
        ).compute(conditionArg, [new Condition(conditionArg, criterion)])
      }
    )
  }

  public countifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COUNTIFS'), (...args) => {
      const conditions: Condition[] = []
      for (let i = 0; i < args.length; i += 2) {
        const conditionArg = args[i] as SimpleRangeValue
        const criterionPackage = this.interpreter.criterionBuilder.fromCellValue(args[i+1], this.interpreter.arithmeticHelper)
        if (criterionPackage === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }
        conditions.push(new Condition(conditionArg, criterionPackage))
      }

      return new CriterionFunctionCompute<number>(
        this.interpreter,
        countifsCacheKey,
        0,
        (left, right) => left + right,
        () => 1,
      ).compute(conditions[0].conditionRange, conditions)
    })
  }
}
