import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, InternalCellValue, EmptyValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {CriterionCache, DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {Interpreter} from '../Interpreter'
import {split} from '../../generatorUtils'
import { ProcedureAst} from '../../parser'
import {coerceToRange} from '../coerce'
import { CriterionLambda, CriterionPackage} from '../Criterion'
import { SimpleRangeValue} from '../InterpreterValue'
import {nonstrictadd} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import {CriterionFunctionCompute, Condition} from '../CriterionFunctionCompute'

class AverageResult {
  constructor(
    public readonly sum: number,
    public readonly count: number,
  ) { }

  public static empty = new AverageResult(0, 0)

  public static single(arg: number): AverageResult {
    return new AverageResult(arg, 1)
  }

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

/** Computes key for criterion function cache */
function sumifCacheKey(conditions: Condition[]): string {
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['SUMIF', ...conditionsStrings].join(',')
}

function averageifCacheKey(conditions: Condition[]): string {
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['AVERAGEIF', ...conditionsStrings].join(',')
}

function countifsCacheKey(conditions: Condition[]): string {
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.range()!.sheet},${c.conditionRange.range()!.start.col},${c.conditionRange.range()!.start.row}`)
  return ['COUNTIFS', ...conditionsStrings].join(',')
}

export class SumifPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sumif: {
      translationKey: 'SUMIF',
    },
    countif: {
      translationKey: 'COUNTIF',
    },
    averageif: {
      translationKey: 'AVERAGEIF',
    },
    sumifs: {
      translationKey: 'SUMIFS',
    },
    countifs: {
      translationKey: 'COUNTIFS',
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
  public sumif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }
    const conditionArgValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (conditionArgValue instanceof CellError) {
      return conditionArgValue
    }
    const conditionArg = coerceToRange(conditionArgValue)

    const criterionValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (criterionValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else if (criterionValue instanceof CellError) {
      return criterionValue
    }
    const criterionPackage = CriterionPackage.fromCellValue(criterionValue)
    if (criterionPackage === undefined) {
      return new CellError(ErrorType.VALUE)
    }

    let valuesArg
    if (ast.args.length == 2) {
      valuesArg = conditionArg
    } else {
      const valuesArgValue = this.evaluateAst(ast.args[2], formulaAddress)
      if (valuesArgValue instanceof CellError) {
        return valuesArgValue
      }
      valuesArg = coerceToRange(valuesArgValue)
    }

    const result = new CriterionFunctionCompute<InternalCellValue>(
      this.interpreter,
      sumifCacheKey,
      0,
      (left, right) => nonstrictadd(left, right),
      (arg) => arg,
    ).compute(valuesArg, [new Condition(conditionArg, criterionPackage)])

    return result
  }

  public sumifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 3 || ast.args.length % 2 === 0) {
      return new CellError(ErrorType.NA)
    }
    const valueArgValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (valueArgValue instanceof CellError) {
      return valueArgValue
    }
    const valuesArg = coerceToRange(valueArgValue)

    const conditions: Condition[] = []
    for (let i = 1; i < ast.args.length; i += 2) {
      const conditionArgValue = this.evaluateAst(ast.args[i], formulaAddress)
      if (conditionArgValue instanceof CellError) {
        return conditionArgValue
      }
      const conditionArg = coerceToRange(conditionArgValue)
      const criterionValue = this.evaluateAst(ast.args[i + 1], formulaAddress)
      if (criterionValue instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      } else if (criterionValue instanceof CellError) {
        return criterionValue
      }
      const criterionPackage = CriterionPackage.fromCellValue(criterionValue)
      if (criterionPackage === undefined) {
        return new CellError(ErrorType.VALUE)
      }
      conditions.push(new Condition(conditionArg, criterionPackage))
    }

    const result = new CriterionFunctionCompute<InternalCellValue>(
      this.interpreter,
      sumifCacheKey,
      0,
      (left, right) => nonstrictadd(left, right),
      (arg) => arg,
    ).compute(valuesArg, conditions)

    return result
  }

  public averageif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }
    const conditionArgValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (conditionArgValue instanceof CellError) {
      return conditionArgValue
    }
    const conditionArg = coerceToRange(conditionArgValue)

    const criterionValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (criterionValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else if (criterionValue instanceof CellError) {
      return criterionValue
    }
    const criterionPackage = CriterionPackage.fromCellValue(criterionValue)
    if (criterionPackage === undefined) {
      return new CellError(ErrorType.VALUE)
    }

    let valuesArg
    if (ast.args.length == 2) {
      valuesArg = conditionArg
    } else {
      const valuesArgValue = this.evaluateAst(ast.args[2], formulaAddress)
      if (valuesArgValue instanceof CellError) {
        return valuesArgValue
      }
      valuesArg = coerceToRange(valuesArgValue)
    }

    const averageResult = new CriterionFunctionCompute<AverageResult>(
      this.interpreter,
      averageifCacheKey,
      AverageResult.empty,
      (left, right) => left.compose(right),
      (arg: InternalCellValue) => {
        if (typeof arg === 'number') {
          return AverageResult.single(arg)
        } else {
          return AverageResult.empty
        }
      }
    ).compute(valuesArg, [new Condition(conditionArg, criterionPackage)])
    if (averageResult instanceof CellError) {
      return averageResult
    } else {
      return averageResult.averageValue() || new CellError(ErrorType.DIV_BY_ZERO)
    }
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
  public countif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const conditionArgValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (conditionArgValue instanceof CellError) {
      return conditionArgValue
    }
    const conditionArg = coerceToRange(conditionArgValue)

    const criterionValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (criterionValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else if (criterionValue instanceof CellError) {
      return criterionValue
    }
    const criterionPackage = CriterionPackage.fromCellValue(criterionValue)
    if (criterionPackage === undefined) {
      return new CellError(ErrorType.VALUE)
    }

    const result = new CriterionFunctionCompute<number>(
      this.interpreter,
      () => 'COUNTIF',
      0,
      (left, right) => left + right,
      (arg) => 1,
    ).compute(conditionArg, [new Condition(conditionArg, criterionPackage)])

    return result
  }

  public countifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 2 || ast.args.length % 2 === 1) {
      return new CellError(ErrorType.NA)
    }

    const conditions: Condition[] = []
    for (let i = 0; i < ast.args.length; i += 2) {
      const conditionArgValue = this.evaluateAst(ast.args[i], formulaAddress)
      if (conditionArgValue instanceof CellError) {
        return conditionArgValue
      }
      const conditionArg = coerceToRange(conditionArgValue)
      const criterionValue = this.evaluateAst(ast.args[i + 1], formulaAddress)
      if (criterionValue instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      } else if (criterionValue instanceof CellError) {
        return criterionValue
      }
      const criterionPackage = CriterionPackage.fromCellValue(criterionValue)
      if (criterionPackage === undefined) {
        return new CellError(ErrorType.VALUE)
      }
      conditions.push(new Condition(conditionArg, criterionPackage))
    }

    const result = new CriterionFunctionCompute<number>(
      this.interpreter,
      countifsCacheKey,
      0,
      (left, right) => left + right,
      (arg) => 1,
    ).compute(conditions[0].conditionRange, conditions)

    return result
  }
}
