/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress} from '../Cell'
import {CriterionCache, DependencyGraph, RangeVertex} from '../DependencyGraph'
import {ErrorMessage} from '../error-message'
import {split} from '../generatorUtils'
import {Maybe} from '../Maybe'
import {CriterionLambda, CriterionPackage} from './Criterion'
import {Interpreter} from './Interpreter'
import {EmptyValue, getRawValue, InternalScalarValue, RawScalarValue} from './InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'

const findSmallerRangeForMany = (dependencyGraph: DependencyGraph, conditionRanges: AbsoluteCellRange[], valuesRange: AbsoluteCellRange): { smallerRangeVertex?: RangeVertex, restConditionRanges: AbsoluteCellRange[], restValuesRange: AbsoluteCellRange } => {
  if (valuesRange.end.row > valuesRange.start.row) {
    const valuesRangeEndRowLess = simpleCellAddress(valuesRange.end.sheet, valuesRange.end.col, valuesRange.end.row - 1)
    const rowLessVertex = dependencyGraph.getRange(valuesRange.start, valuesRangeEndRowLess)
    if (rowLessVertex !== undefined) {
      return {
        smallerRangeVertex: rowLessVertex,
        restValuesRange: valuesRange.withStart(simpleCellAddress(valuesRange.start.sheet, valuesRange.start.col, valuesRange.end.row)),
        restConditionRanges: conditionRanges.map((conditionRange) => conditionRange.withStart(simpleCellAddress(conditionRange.start.sheet, conditionRange.start.col, conditionRange.end.row))),
      }
    }
  }
  return {
    restValuesRange: valuesRange,
    restConditionRanges: conditionRanges,
  }
}

export class CriterionFunctionCompute<T> {
  private readonly dependencyGraph: DependencyGraph

  constructor(
    private readonly interpreter: Interpreter,
    private readonly cacheKey: (conditions: Condition[]) => string,
    private readonly reduceInitialValue: T,
    private readonly composeFunction: (left: T, right: T) => T,
    private readonly mapFunction: (arg: InternalScalarValue) => T,
  ) {
    this.dependencyGraph = this.interpreter.dependencyGraph
  }

  public compute(simpleValuesRange: SimpleRangeValue, conditions: Condition[]): T | CellError {
    for (const condition of conditions) {
      if (!haveSameDimensions(condition.conditionRange, simpleValuesRange)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
      }
    }

    const valuesRangeVertex = this.tryToGetRangeVertexForRangeValue(simpleValuesRange)
    const conditionsVertices = conditions.map((c) => this.tryToGetRangeVertexForRangeValue(c.conditionRange))

    if (valuesRangeVertex && conditionsVertices.every((e) => e !== undefined)) {
      const fullCriterionString = conditions.map((c) => c.criterionPackage.raw).join(',')
      const cachedResult = this.findAlreadyComputedValueInCache(valuesRangeVertex, this.cacheKey(conditions), fullCriterionString)
      if (cachedResult !== undefined) {
        this.interpreter.stats.incrementCriterionFunctionFullCacheUsed()
        return cachedResult
      }

      const cache = this.buildNewCriterionCache(this.cacheKey(conditions), conditions.map((c) => c.conditionRange.range!), simpleValuesRange.range!)

      if (!cache.has(fullCriterionString)) {
        cache.set(fullCriterionString, [
          this.evaluateRangeValue(simpleValuesRange, conditions),
          conditions.map((condition) => condition.criterionPackage.lambda),
        ])
      }

      valuesRangeVertex.setCriterionFunctionValues(this.cacheKey(conditions), cache)
      conditionsVertices.forEach(range => {
        if (range !== undefined) {
          range.addDependentCacheRange(valuesRangeVertex)
        }
      })

      return cache.get(fullCriterionString)![0]
    } else {
      return this.evaluateRangeValue(simpleValuesRange, conditions)
    }
  }

  private tryToGetRangeVertexForRangeValue(rangeValue: SimpleRangeValue): Maybe<RangeVertex> {
    const maybeRange = rangeValue.range
    if (maybeRange === undefined) {
      return undefined
    } else {
      return this.dependencyGraph.getRange(maybeRange.start, maybeRange.end)
    }
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

  private evaluateRangeValue(simpleValuesRange: SimpleRangeValue, conditions: Condition[]) {
    const criterionLambdas = conditions.map((condition) => condition.criterionPackage.lambda)
    const values = Array.from(simpleValuesRange.valuesFromTopLeftCorner()).map(this.mapFunction)[Symbol.iterator]()
    const conditionsIterators = conditions.map((condition) => condition.conditionRange.iterateValuesFromTopLeftCorner())
    const filteredValues = ifFilter(criterionLambdas, conditionsIterators, values)
    const result = this.reduceFunction(filteredValues)

    // An open-ended range leaves the cells past the cells of the sheets out of its data. They are empty in the values
    // range and in every condition range, unless a condition is an array computed from a range rather than a range.
    const numberOfEmptyCellsPastData = simpleValuesRange.fullWidth() * simpleValuesRange.fullHeight() - simpleValuesRange.numberOfElements()
    const everyConditionIsRange = conditions.every((condition) => !condition.conditionRange.isAdHoc())
    if (numberOfEmptyCellsPastData > 0 && everyConditionIsRange && criterionLambdas.every((lambda) => lambda(EmptyValue))) {
      return this.composeFunction(result, this.composeRepeatedly(this.mapFunction(EmptyValue), numberOfEmptyCellsPastData))
    }
    return result
  }

  /**
   * Composes `times` copies of a value, in a logarithmic number of steps. Relies on the compose function being associative.
   */
  private composeRepeatedly(value: T, times: number): T {
    if (times === 1) {
      return value
    }
    const half = this.composeRepeatedly(value, Math.floor(times / 2))
    const doubled = this.composeFunction(half, half)
    return times % 2 === 0 ? doubled : this.composeFunction(doubled, value)
  }

  private buildNewCriterionCache(cacheKey: string, simpleConditionRanges: AbsoluteCellRange[], simpleValuesRange: AbsoluteCellRange): CriterionCache {
    const currentRangeVertex = this.dependencyGraph.getRange(simpleValuesRange.start, simpleValuesRange.end)!
    const {smallerRangeVertex, restConditionRanges, restValuesRange} = findSmallerRangeForMany(this.dependencyGraph, simpleConditionRanges, simpleValuesRange)

    let smallerCache
    if (smallerRangeVertex !== undefined && this.dependencyGraph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      smallerCache = smallerRangeVertex.getCriterionFunctionValues(cacheKey)
    } else {
      smallerCache = new Map()
    }

    const newCache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambdas]: [T, CriterionLambda[]], key: string) => {
      const filteredValues = ifFilter(criterionLambdas, restConditionRanges.map((rcr) => getRangeValues(this.dependencyGraph, rcr)), Array.from(getRangeValues(this.dependencyGraph, restValuesRange)).map(this.mapFunction)[Symbol.iterator]())
      const newCacheValue = this.composeFunction(value, this.reduceFunction(filteredValues))
      this.interpreter.stats.incrementCriterionFunctionPartialCacheUsed()
      newCache.set(key, [newCacheValue, criterionLambdas])
    })

    return newCache
  }
}

export class Condition {
  constructor(
    public readonly conditionRange: SimpleRangeValue,
    public readonly criterionPackage: CriterionPackage,
  ) {
  }
}

function* getRangeValues(dependencyGraph: DependencyGraph, cellRange: AbsoluteCellRange): IterableIterator<RawScalarValue> {
  for (const cellFromRange of cellRange.addresses(dependencyGraph)) {
    yield getRawValue(dependencyGraph.getScalarValue(cellFromRange))
  }
}

/**
 * Checks whether two range values pair up cell by cell. Their data must have the same size, and when both are ranges,
 * the ranges must have the same full size as well, because the data of an open-ended range can be smaller than the range.
 */
function haveSameDimensions(left: SimpleRangeValue, right: SimpleRangeValue): boolean {
  if (!left.sameDimensionsAs(right)) {
    return false
  }
  if (left.isAdHoc() || right.isAdHoc()) {
    return true
  }
  return left.fullWidth() === right.fullWidth() && left.fullHeight() === right.fullHeight()
}

function* ifFilter<T>(criterionLambdas: CriterionLambda[], conditionalIterables: IterableIterator<InternalScalarValue>[], computableIterable: IterableIterator<T>): IterableIterator<T> {
  for (const computable of computableIterable) {
    const conditionalSplits = conditionalIterables.map((conditionalIterable) => split(conditionalIterable))
    if (!conditionalSplits.every((cs) => Object.prototype.hasOwnProperty.call(cs, 'value'))) {
      return
    }
    const conditionalFirsts = conditionalSplits.map((cs) => getRawValue(cs.value) as RawScalarValue)
    if (zip(conditionalFirsts, criterionLambdas).every(([conditionalFirst, criterionLambda]) => criterionLambda(conditionalFirst))) {
      yield computable
    }
    conditionalIterables = conditionalSplits.map((cs) => cs.rest)
  }
}

function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  const result: [T, U][] = []
  for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    result.push([arr1[i], arr2[i]])
  }
  return result
}
