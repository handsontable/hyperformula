/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteOpenEndedRange} from '../AbsoluteCellRange'
import {ArraySize} from '../ArraySize'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../Cell'
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
    const pairedSize = findPairedSize([simpleValuesRange, ...conditions.map((condition) => condition.conditionRange)])
    if (pairedSize === undefined) {
      return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
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
          this.evaluateRangeValue(simpleValuesRange, conditions, pairedSize),
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
      return this.evaluateRangeValue(simpleValuesRange, conditions, pairedSize)
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

  private evaluateRangeValue(simpleValuesRange: SimpleRangeValue, conditions: Condition[], pairedSize: PairedSize) {
    const criterionLambdas = conditions.map((condition) => condition.criterionPackage.lambda)
    const values = Array.from(valuesPaddedTo(simpleValuesRange, pairedSize.data)).map(this.mapFunction)[Symbol.iterator]()
    const conditionsIterators = conditions.map((condition) => valuesPaddedTo(condition.conditionRange, pairedSize.data))
    const filteredValues = ifFilter(criterionLambdas, conditionsIterators, values)
    const result = this.reduceFunction(filteredValues)

    // The cells past the data are empty in the values range and in every condition range.
    const numberOfEmptyCellsPastData = pairedSize.full.width * pairedSize.full.height - pairedSize.data.width * pairedSize.data.height
    if (numberOfEmptyCellsPastData > 0 && criterionLambdas.every((lambda) => lambda(EmptyValue))) {
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
 * The size over which the values range and the condition ranges of a criterion function pair up cell by cell,
 * and the size of the data that is read from each of them. Every cell past the data is empty.
 */
interface PairedSize {
  full: ArraySize,
  data: ArraySize,
}

/**
 * The extent of a range value along one axis.
 */
interface AxisExtent {
  /** Number of cells of the data along the axis */
  data: number,
  /** Number of cells of the range along the axis, or undefined for a range that spans the whole axis */
  declared?: number,
  /** Whether the range is an open-ended range */
  isOpenEnded: boolean,
  /** Sheet of the range */
  sheet: number,
  /** Start of the range along the axis */
  start: number,
}

/**
 * Finds the size over which range values pair up cell by cell, or returns undefined when they do not pair up.
 *
 * Arrays pair up by the size of their data. Ranges pair up by their declared size: an open-ended range pairs up with
 * ranges of its own size even where its data, cut where the sheets end, is smaller. A whole-column or whole-row range
 * has no declared size and pairs up with a range by the size of its data. Paired with open-ended ranges only, it pairs up
 * when its data fits in them and none of them starts before it on its sheet. These include every pair that its sheet
 * would accept if it held a cell for every cell of the open-ended ranges.
 */
function findPairedSize(rangeValues: SimpleRangeValue[]): Maybe<PairedSize> {
  const ranges = rangeValues.filter((rangeValue) => !rangeValue.isAdHoc())
  const width = findPairedExtent(ranges.map((rangeValue) => axisExtent(rangeValue, rangeValue.width(), (address) => address.col)))
  const height = findPairedExtent(ranges.map((rangeValue) => axisExtent(rangeValue, rangeValue.height(), (address) => address.row)))
  if (width === undefined || height === undefined) {
    return undefined
  }

  if (ranges.length < rangeValues.length) {
    const [first, ...rest] = rangeValues
    if (!rest.every((rangeValue) => rangeValue.sameDimensionsAs(first))) {
      return undefined
    }
    return {full: first.size, data: first.size}
  }

  return {
    full: new ArraySize(width.full, height.full),
    data: new ArraySize(width.data, height.data),
  }
}

/**
 * Returns the extent along one axis of a range value that has a range.
 */
function axisExtent(rangeValue: SimpleRangeValue, data: number, coordinate: (address: SimpleCellAddress) => number): AxisExtent {
  const range = rangeValue.range as AbsoluteCellRange
  const declared = coordinate(range.end) - coordinate(range.start) + 1
  return {
    data,
    declared: Number.isFinite(declared) ? declared : undefined,
    isOpenEnded: range instanceof AbsoluteOpenEndedRange,
    sheet: range.sheet,
    start: coordinate(range.start),
  }
}

/**
 * Finds the extent along one axis over which ranges pair up, and the extent of the data read from them,
 * or returns undefined when they do not pair up.
 */
function findPairedExtent(extents: AxisExtent[]): Maybe<{ full: number, data: number }> {
  const data = Math.max(0, ...extents.map((extent) => extent.data))
  const declaredExtents = extents.map((extent) => extent.declared).filter((declared): declared is number => declared !== undefined)

  if (declaredExtents.length === 0) {
    return extents.every((extent) => extent.data === data) ? {full: data, data} : undefined
  }

  const full = declaredExtents[0]
  if (!declaredExtents.every((declared) => declared === full)) {
    return undefined
  }

  if (extents.some((extent) => extent.declared !== undefined && !extent.isOpenEnded)) {
    return extents.every((extent) => extent.data === full) ? {full, data} : undefined
  }

  const openEndedExtents = extents.filter((extent) => extent.isOpenEnded)
  const everyWholeRangePairsUp = extents.filter((extent) => extent.declared === undefined).every((wholeExtent) =>
    wholeExtent.data <= full && openEndedExtents.every((openEndedExtent) => openEndedExtent.sheet !== wholeExtent.sheet || openEndedExtent.start <= wholeExtent.start)
  )
  return everyWholeRangePairsUp ? {full, data} : undefined
}

/**
 * Iterates over the values of a range value from its top left corner, row by row, as if its data had the given size.
 * The cells past its data are empty.
 */
function* valuesPaddedTo(rangeValue: SimpleRangeValue, size: ArraySize): IterableIterator<InternalScalarValue> {
  if (rangeValue.width() === size.width && rangeValue.height() === size.height) {
    yield* rangeValue.iterateValuesFromTopLeftCorner()
    return
  }
  const data = rangeValue.data
  for (let row = 0; row < size.height; row++) {
    for (let column = 0; column < size.width; column++) {
      yield data[row]?.[column] ?? EmptyValue
    }
  }
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
