import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, EmptyValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {CriterionCache, DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {Interpreter} from '../Interpreter'
import {count, split} from '../../generatorUtils'
import { ProcedureAst} from '../../parser'
import {coerceToRange} from '../coerce'
import { CriterionLambda, CriterionPackage} from '../Criterion'
import { SimpleRangeValue} from '../InterpreterValue'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'

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

/** COUNTIF key for criterion function cache */
const COUNTIF_CACHE_KEY = 'COUNTIF'

class CriterionFunctionCompute<T> {
  private readonly dependencyGraph: DependencyGraph

  constructor(
    private readonly interpreter: Interpreter,
    private readonly cacheKey: (conditions: Condition[]) => string,
    private readonly reduceInitialValue: T,
    private readonly composeFunction: (left: T, right: T) => T,
    private readonly mapFunction: (arg: CellValue) => T,
  ) {
    this.dependencyGraph = this.interpreter.dependencyGraph
  }

  public compute(simpleValuesRange: SimpleRangeValue, conditions: Condition[]): T | CellError {
    for (const condition of conditions) {
      if (!condition.conditionRange.sameDimensionsAs(simpleValuesRange)) {
        return new CellError(ErrorType.VALUE)
      }
    }

    const valuesRangeVertex = this.tryToGetRangeVertexForRangeValue(simpleValuesRange)
    const conditionsVertices = conditions.map((c) => this.tryToGetRangeVertexForRangeValue(c.conditionRange))

    if (valuesRangeVertex && conditionsVertices.every((e) => e !== undefined)) {
      const fullCriterionString = conditions.map((c) => c.criterionPackage.raw).join(',')
      const cachedResult = this.findAlreadyComputedValueInCache(valuesRangeVertex, this.cacheKey(conditions), fullCriterionString)
      if (cachedResult) {
        this.interpreter.stats.criterionFunctionFullCacheUsed++
        return cachedResult
      }

      const cache = this.buildNewCriterionCache2(this.cacheKey(conditions), conditions.map((c) => c.conditionRange.range()!), simpleValuesRange.range()!)

      if (!cache.has(fullCriterionString)) {
        cache.set(fullCriterionString, [
          this.evaluateRangeValue(simpleValuesRange, conditions),
          conditions.map((condition) => condition.criterionPackage.lambda),
        ])
      }

      valuesRangeVertex.setCriterionFunctionValues(this.cacheKey(conditions), cache)

      return cache.get(fullCriterionString)![0]
    } else {
      return this.evaluateRangeValue(simpleValuesRange, conditions)
    }
  }

  private tryToGetRangeVertexForRangeValue(rangeValue: SimpleRangeValue): RangeVertex | undefined {
    const maybeRange = rangeValue.range()
    if (maybeRange === undefined) {
      return undefined
    } else {
      return this.dependencyGraph.getRange(maybeRange.start, maybeRange.end) || undefined
    }
  }

  private evaluateRangeValue(simpleValuesRange: SimpleRangeValue, conditions: Condition[]): T {
    return this.computeCriterionValue3(
      conditions,
      simpleValuesRange,
      (filteredValues: IterableIterator<T>) => {
        return this.reduceFunction(filteredValues)
      },
    )
  }

  private reduceFunction(iterable: IterableIterator<T>): T {
    let acc = this.reduceInitialValue
    for (const val of iterable) {
      acc = this.composeFunction(acc, val)
    }
    return acc
  }

  private findAlreadyComputedValueInCache(rangeVertex: RangeVertex, cacheKey: string, criterionString: string) {
    return rangeVertex.getCriterionFunctionValue(cacheKey, criterionString)
  }

  private computeCriterionValue3(conditions: Condition[], simpleValuesRange: SimpleRangeValue, valueComputingFunction: ((filteredValues: IterableIterator<T>) => T)) {
    const criterionLambdas = conditions.map((condition) => condition.criterionPackage.lambda)
    const values = Array.from(simpleValuesRange.valuesFromTopLeftCorner()).map(this.mapFunction)[Symbol.iterator]()
    const conditionsIterators = conditions.map((condition) => condition.conditionRange.valuesFromTopLeftCorner())
    const filteredValues = ifFilter(criterionLambdas, conditionsIterators, values)
    return valueComputingFunction(filteredValues)
  }

  private buildNewCriterionCache2(cacheKey: string, simpleConditionRanges: AbsoluteCellRange[], simpleValuesRange: AbsoluteCellRange): CriterionCache {
    const currentRangeVertex = this.dependencyGraph.getRange(simpleValuesRange.start, simpleValuesRange.end)!
      const {smallerRangeVertex, restConditionRanges, restValuesRange} = findSmallerRange(this.dependencyGraph, simpleConditionRanges, simpleValuesRange)

    let smallerCache
    if (smallerRangeVertex && this.dependencyGraph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      smallerCache = smallerRangeVertex.getCriterionFunctionValues(cacheKey)
    } else {
      smallerCache = new Map()
    }

    const newCache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambdas]: [T, CriterionLambda[]], key: string) => {
      const filteredValues = ifFilter(criterionLambdas, restConditionRanges.map((rcr) => getRangeValues(this.dependencyGraph, rcr)), Array.from(getRangeValues(this.dependencyGraph, restValuesRange)).map(this.mapFunction)[Symbol.iterator]())
      const newCacheValue = this.composeFunction(value, this.reduceFunction(filteredValues))
      newCache.set(key, [newCacheValue, criterionLambdas])
    })

    return newCache
  }
}

/**
 * Finds smaller available range when computing criterion functions.
 *
 * @param rangeMapping - Range Mapping dependency
 * @param conditionRange - range for condition on which criterion finds accepted cells
 * @param valuesRange - range for values on which we run aggregate functions
 */
export const findSmallerRange = (dependencyGraph: DependencyGraph, conditionRanges: AbsoluteCellRange[], valuesRange: AbsoluteCellRange): {smallerRangeVertex: RangeVertex | null, restConditionRanges: AbsoluteCellRange[], restValuesRange: AbsoluteCellRange} => {
  if (valuesRange.end.row > valuesRange.start.row) {
    const valuesRangeEndRowLess = simpleCellAddress(valuesRange.end.sheet, valuesRange.end.col, valuesRange.end.row - 1)
    const rowLessVertex = dependencyGraph.getRange(valuesRange.start, valuesRangeEndRowLess)
    if (rowLessVertex) {
      return {
        smallerRangeVertex: rowLessVertex,
        restValuesRange: valuesRange.withStart(simpleCellAddress(valuesRange.start.sheet, valuesRange.start.col, valuesRange.end.row)),
        restConditionRanges: conditionRanges.map((conditionRange) => conditionRange.withStart(simpleCellAddress(conditionRange.start.sheet, conditionRange.start.col, conditionRange.end.row))),
      }
    }
  }
  return {
    smallerRangeVertex: null,
    restValuesRange: valuesRange,
    restConditionRanges: conditionRanges,
  }
}

class Condition {
  constructor(
    public readonly conditionRange: SimpleRangeValue,
    public readonly criterionPackage: CriterionPackage,
  ) {
  }
}

type CacheBuildingFunction = (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => CellValue

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
  public sumif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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

    const result = new CriterionFunctionCompute<CellValue>(
      this.interpreter,
      sumifCacheKey,
      0,
      (left, right) => add(left, right),
      (arg) => arg,
    ).compute(valuesArg, [new Condition(conditionArg, criterionPackage)])

    return result
  }

  public sumifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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

    const result = new CriterionFunctionCompute<CellValue>(
      this.interpreter,
      sumifCacheKey,
      0,
      (left, right) => add(left, right),
      (arg) => arg,
    ).compute(valuesArg, conditions)

    return result
  }

  public averageif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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
      (arg: CellValue) => {
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
  public countif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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

    return this.evaluateRangeCountif(new Condition(conditionArg, criterionPackage))
  }

  public countifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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

    return this.evaluateRangeCountif(conditions[0])
  }

  private tryToGetRangeVertexForRangeValue(rangeValue: SimpleRangeValue): RangeVertex | undefined {
    const maybeRange = rangeValue.range()
    if (maybeRange === undefined) {
      return undefined
    } else {
      return this.dependencyGraph.getRange(maybeRange.start, maybeRange.end) || undefined
    }
  }

  /**
   * Computes COUNTIF function for range arguments.
   *
   * @param simpleConditionRange - condition range
   * @param criterionString - criterion in raw string format
   * @param criterion - already parsed criterion structure
   */
  private evaluateRangeCountif(condition: Condition): CellValue {
    const simpleConditionRange = condition.conditionRange
    const criterionPackage = condition.criterionPackage
    const conditionRangeVertex = this.tryToGetRangeVertexForRangeValue(simpleConditionRange)

    if (conditionRangeVertex) {
      const cachedResult = this.findAlreadyComputedValueInCache(conditionRangeVertex, COUNTIF_CACHE_KEY, criterionPackage.raw)
      if (cachedResult) {
        this.interpreter.stats.criterionFunctionFullCacheUsed++
        return cachedResult
      }

      const cache = this.buildNewCriterionCache(COUNTIF_CACHE_KEY, [simpleConditionRange.range()!], simpleConditionRange.range()!,
        (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => {
          this.interpreter.stats.criterionFunctionPartialCacheUsed++
          return (cacheCurrentValue as number) + count(newFilteredValues)
        })

      if (!cache.has(criterionPackage.raw)) {
        cache.set(criterionPackage.raw, [
          this.evaluateRangeCountifValue(simpleConditionRange, criterionPackage),
          [criterionPackage.lambda],
        ])
      }

      conditionRangeVertex.setCriterionFunctionValues(COUNTIF_CACHE_KEY, cache)

      return cache.get(criterionPackage.raw)![0]
    } else {
      return this.evaluateRangeCountifValue(simpleConditionRange, criterionPackage)
    }
  }

  private evaluateRangeCountifValue(simpleConditionRange: SimpleRangeValue, criterionPackage: CriterionPackage): CellValue {
    return this.computeCriterionValue2(
      [new Condition(simpleConditionRange, criterionPackage)],
      simpleConditionRange,
      (filteredValues: IterableIterator<CellValue>) => {
        return count(filteredValues)
      },
    )
  }

  /**
   * Finds whether criterion was already computed for given range
   *
   * @param simpleConditionRange - condition range
   * @param criterionString - criterion in raw string format
   * @param criterion - already parsed criterion structure
   */
  private findAlreadyComputedValueInCache(rangeVertex: RangeVertex, cacheKey: string, criterionString: string) {
    return rangeVertex.getCriterionFunctionValue(cacheKey, criterionString)
  }

  /**
   * Builds new criterion cache.
   *
   * @param cacheKey - key to use in criterion cache
   * @param simpleConditionRange - condition range
   * @param simpleValuesRange - values range
   * @param cacheBuilder - function used to compute values in new cache
   */
  private buildNewCriterionCache(cacheKey: string, simpleConditionRanges: AbsoluteCellRange[], simpleValuesRange: AbsoluteCellRange, cacheBuilder: CacheBuildingFunction): CriterionCache {
    const currentRangeVertex = this.dependencyGraph.getRange(simpleValuesRange.start, simpleValuesRange.end)!
    const {smallerRangeVertex, restConditionRanges, restValuesRange} = findSmallerRange(this.dependencyGraph, simpleConditionRanges, simpleValuesRange)

    let smallerCache
    if (smallerRangeVertex && this.dependencyGraph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      smallerCache = smallerRangeVertex.getCriterionFunctionValues(cacheKey)
    } else {
      smallerCache = new Map()
    }

    const newCache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambdas]: [CellValue, CriterionLambda[]], key: string) => {
      const filteredValues = ifFilter(criterionLambdas, restConditionRanges.map((rcr) => getRangeValues(this.dependencyGraph, rcr)), getRangeValues(this.dependencyGraph, restValuesRange))
      const newCacheValue = cacheBuilder(key, value, filteredValues)
      newCache.set(key, [newCacheValue, criterionLambdas])
    })

    return newCache
  }

  /**
   * Computes value of criterion function if no partial result available.
   *
   * @param criterion - criterion structure to compute
   * @param simpleConditionRange - condition range
   * @param simpleValuesRange - values range
   * @param valueComputingFunction - function used to compute final value out of list of filtered cell values
   */
  private computeCriterionValue2(conditions: Condition[], simpleValuesRange: SimpleRangeValue, valueComputingFunction: ((filteredValues: IterableIterator<CellValue>) => (CellValue))) {
    const criterionLambdas = conditions.map((condition) => condition.criterionPackage.lambda)
    const values = simpleValuesRange.valuesFromTopLeftCorner()
    const conditionsIterators = conditions.map((condition) => condition.conditionRange.valuesFromTopLeftCorner())
    const filteredValues = ifFilter(criterionLambdas, conditionsIterators, values)
    return valueComputingFunction(filteredValues)
  }
}

function * getRangeValues(dependencyGraph: DependencyGraph, cellRange: AbsoluteCellRange): IterableIterator<CellValue> {
  for (const cellFromRange of cellRange.addresses()) {
    yield dependencyGraph.getCellValue(cellFromRange)
  }
}

export function* ifFilter<T>(criterionLambdas: CriterionLambda[], conditionalIterables: Array<IterableIterator<CellValue>>, computableIterable: IterableIterator<T>): IterableIterator<T> {
  for (const computable of computableIterable) {
    const conditionalSplits = conditionalIterables.map((conditionalIterable) => split(conditionalIterable))
    if (!conditionalSplits.every((cs) => cs.hasOwnProperty('value'))) {
      return
    }
    const conditionalFirsts = conditionalSplits.map((cs) => (cs.value as CellValue))
    if (zip(conditionalFirsts, criterionLambdas).every(([conditionalFirst, criterionLambda]) => criterionLambda(conditionalFirst) as boolean)) {
      yield computable
    }
    conditionalIterables = conditionalSplits.map((cs) => cs.rest)
  }
}

export function zip<T, U>(arr1: T[], arr2: U[]): Array<[T, U]> {
  const result: Array<[T, U]> = []
  for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    result.push([arr1[i], arr2[i]])
  }
  return result
}
