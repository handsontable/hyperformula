import assert from 'assert'
import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {CriterionCache, DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {count, split} from '../../generatorUtils'
import {Ast, AstNodeType, CellReferenceAst, ProcedureAst} from '../../parser'
import {buildCriterionLambda, Criterion, CriterionLambda, parseCriterion} from '../Criterion'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'

/** Computes key for criterion function cache */
function sumifCacheKey(conditions: Condition[]): string {
  const conditionsStrings = conditions.map((c) => `${c.conditionRange.sheet},${c.conditionRange.start.col},${c.conditionRange.start.row}`)
  return ['SUMIF', ...conditionsStrings].join(',')
}

/** COUNTIF key for criterion function cache */
const COUNTIF_CACHE_KEY = 'COUNTIF'

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
    public readonly conditionRange: AbsoluteCellRange,
    public readonly criterionString: string,
    public readonly criterion: Criterion,
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
    sumifs: {
      translationKey: 'SUMIFS',
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
    const criterionString = this.evaluateAst(ast.args[1], formulaAddress)
    if (typeof criterionString !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    const criterion = parseCriterion(criterionString)
    if (criterion === null) {
      return new CellError(ErrorType.VALUE)
    }

    const conditionRangeArg = ast.args[0]
    const valuesRangeArg = ast.args[2]

    if (conditionRangeArg.type === AstNodeType.CELL_RANGE && valuesRangeArg.type === AstNodeType.CELL_RANGE) {
      const simpleValuesRange = AbsoluteCellRange.fromCellRange(valuesRangeArg, formulaAddress)
      const simpleConditionRange = AbsoluteCellRange.fromCellRange(conditionRangeArg, formulaAddress)

      return this.evaluateRangeSumif(simpleValuesRange, [new Condition(simpleConditionRange, criterionString, criterion)])
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE && valuesRangeArg.type === AstNodeType.CELL_REFERENCE) {
      const simpleValuesRange = AbsoluteCellRange.singleRangeFromCellAddress(valuesRangeArg.reference, formulaAddress)
      const simpleConditionRange = AbsoluteCellRange.singleRangeFromCellAddress(conditionRangeArg.reference, formulaAddress)

      return this.evaluateRangeSumif(simpleValuesRange, [new Condition(simpleConditionRange, criterionString, criterion)])
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  public sumifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const criterionString = this.evaluateAst(ast.args[2], formulaAddress)
    if (typeof criterionString !== 'string' && typeof criterionString !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    const criterion = parseCriterion(criterionString)
    if (criterion === null) {
      return new CellError(ErrorType.VALUE)
    }

    const conditionRangeArg = ast.args[1]
    const valuesRangeArg = ast.args[0]

    if (conditionRangeArg.type === AstNodeType.CELL_RANGE && valuesRangeArg.type === AstNodeType.CELL_RANGE) {
      const simpleValuesRange = AbsoluteCellRange.fromCellRange(valuesRangeArg, formulaAddress)

      const conditions: Condition[] = []
      for (let i = 1; i < ast.args.length; i += 2) {
        const criterionString = this.evaluateAst(ast.args[i + 1], formulaAddress)
        const criterion = parseCriterion(criterionString)
        const conditionRange = this.rangeFromAst(ast.args[i], formulaAddress)
        if (conditionRange === null) {
          return new CellError(ErrorType.VALUE)
        }
        conditions.push(new Condition(
          conditionRange,
          criterionString as string,
          criterion as Criterion,
        ))
      }

      return this.evaluateRangeSumif(simpleValuesRange, conditions)
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE && valuesRangeArg.type === AstNodeType.CELL_REFERENCE) {
      return this.evaluateCellSumifs(ast, formulaAddress, criterion)
    } else {
      return new CellError(ErrorType.VALUE)
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
    const conditionRangeArg = ast.args[0]

    const criterionString = this.evaluateAst(ast.args[1], formulaAddress)
    if (typeof criterionString !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    const criterion = parseCriterion(criterionString)
    if (criterion === null) {
      return new CellError(ErrorType.VALUE)
    }

    const criterionLambda = buildCriterionLambda(criterion)

    if (conditionRangeArg.type === AstNodeType.CELL_RANGE) {
      const simpleConditionRange = AbsoluteCellRange.fromCellRange(conditionRangeArg, formulaAddress)
      return this.evaluateRangeCountif(simpleConditionRange, criterionString, criterion)
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE) {
      const valueFromCellReference = this.evaluateAst(conditionRangeArg, formulaAddress)
      if (valueFromCellReference instanceof SimpleRangeValue) {
        throw "Cant happen"
      }
      const criterionResult = criterionLambda(valueFromCellReference)
      if (criterionResult) {
        return 1
      } else {
        return 0
      }
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  private rangeFromAst(ast: Ast, formulaAddress: SimpleCellAddress): AbsoluteCellRange | null {
    if (ast.type === AstNodeType.CELL_RANGE) {
      return AbsoluteCellRange.fromCellRange(ast, formulaAddress)
    } else if (ast.type === AstNodeType.CELL_REFERENCE) {
      return AbsoluteCellRange.singleRangeFromCellAddress(ast.reference, formulaAddress)
    } else {
      return null
    }
  }

  private evaluateCellSumifs(ast: ProcedureAst, formulaAddress: SimpleCellAddress, criterion: Criterion): CellValue {
    const conditionReferenceArg = ast.args[1] as CellReferenceAst
    const valuesReferenceArg = ast.args[0] as CellReferenceAst

    const conditionValues = [this.evaluateAst(conditionReferenceArg, formulaAddress)][Symbol.iterator]() as IterableIterator<CellValue>
    const computableValues = [this.evaluateAst(valuesReferenceArg, formulaAddress)][Symbol.iterator]() as IterableIterator<CellValue>
    const criterionLambda = buildCriterionLambda(criterion)
    const filteredValues = ifFilter([criterionLambda], [conditionValues], computableValues)
    return reduceSum(filteredValues)
  }

  /**
   * Computes SUMIF function for range arguments.
   *
   * @param simpleConditionRange - condition range
   * @param simpleValuesRange - values range
   * @param criterionString - criterion in raw string format
   * @param criterion - already parsed criterion structure
   */
  private evaluateRangeSumif(simpleValuesRange: AbsoluteCellRange, conditions: Condition[]): CellValue {
    if (!conditions[0].conditionRange.sameDimensionsAs(simpleValuesRange)) {
      return new CellError(ErrorType.VALUE)
    }

    const valuesRangeVertex = this.dependencyGraph.getRange(simpleValuesRange.start, simpleValuesRange.end)!
    
    if (valuesRangeVertex) {
      const fullCriterionString = conditions.map((c) => c.criterionString).join(',')
      const cachedResult = this.findAlreadyComputedValueInCache(valuesRangeVertex, sumifCacheKey(conditions), fullCriterionString)
      if (cachedResult) {
        this.interpreter.stats.sumifFullCacheUsed++
        return cachedResult
      }

      const cache = this.buildNewCriterionCache(sumifCacheKey(conditions), conditions.map((c) => c.conditionRange), simpleValuesRange,
        (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => {
          return add(cacheCurrentValue, reduceSum(newFilteredValues))
        })

      if (!cache.has(fullCriterionString)) {
        cache.set(fullCriterionString, [
          this.evaluateRangeSumifValue(simpleValuesRange, conditions),
          conditions.map((condition) => buildCriterionLambda(condition.criterion))
        ])
      }

      valuesRangeVertex.setCriterionFunctionValues(sumifCacheKey(conditions), cache)

      return cache.get(fullCriterionString)![0]
    } else {
      return this.evaluateRangeSumifValue(simpleValuesRange, conditions)
    }
  }

  private evaluateRangeSumifValue(simpleValuesRange: AbsoluteCellRange, conditions: Condition[]): CellValue {
    return this.computeCriterionValue(
      conditions.map((c) => c.criterion),
      conditions.map((c) => c.conditionRange),
      simpleValuesRange,
      (filteredValues: IterableIterator<CellValue>) => {
        return reduceSum(filteredValues)
      }
    )
  }

  /**
   * Computes COUNTIF function for range arguments.
   *
   * @param simpleConditionRange - condition range
   * @param criterionString - criterion in raw string format
   * @param criterion - already parsed criterion structure
   */
  private evaluateRangeCountif(simpleConditionRange: AbsoluteCellRange, criterionString: string, criterion: Criterion): CellValue {
    const conditionRangeVertex = this.dependencyGraph.getRange(simpleConditionRange.start, simpleConditionRange.end)!
    assert.ok(conditionRangeVertex, 'Range does not exists in graph')

    const cachedResult = this.findAlreadyComputedValueInCache(conditionRangeVertex, COUNTIF_CACHE_KEY, criterionString)
    if (cachedResult) {
      this.interpreter.stats.countifFullCacheUsed++
      return cachedResult
    }

    const cache = this.buildNewCriterionCache(COUNTIF_CACHE_KEY, [simpleConditionRange], simpleConditionRange,
      (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => {
        this.interpreter.stats.countifPartialCacheUsed++
        return (cacheCurrentValue as number) + count(newFilteredValues)
      })

    if (!cache.has(criterionString)) {
      const resultValue = this.computeCriterionValue([criterion], [simpleConditionRange], simpleConditionRange,
        (filteredValues: IterableIterator<CellValue>) => {
          return count(filteredValues)
        })
      cache.set(criterionString, [resultValue, [buildCriterionLambda(criterion)]])
    }

    conditionRangeVertex.setCriterionFunctionValues(COUNTIF_CACHE_KEY, cache)

    return cache.get(criterionString)![0]
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
  private computeCriterionValue(criterions: Criterion[], simpleConditionRanges: AbsoluteCellRange[], simpleValuesRange: AbsoluteCellRange, valueComputingFunction: ((filteredValues: IterableIterator<CellValue>) => (CellValue))) {
    const criterionLambdas = criterions.map((criterion) => buildCriterionLambda(criterion))
    const values = getRangeValues(this.dependencyGraph, simpleValuesRange)
    const conditions = simpleConditionRanges.map((simpleConditionRange) => getRangeValues(this.dependencyGraph, simpleConditionRange))
    const filteredValues = ifFilter(criterionLambdas, conditions, values)
    return valueComputingFunction(filteredValues)
  }
}

function * getRangeValues(dependencyGraph: DependencyGraph, cellRange: AbsoluteCellRange): IterableIterator<CellValue> {
  for (const cellFromRange of cellRange.addresses()) {
    yield dependencyGraph.getCellValue(cellFromRange)
  }
}

export function* ifFilter(criterionLambdas: CriterionLambda[], conditionalIterables: Array<IterableIterator<CellValue>>, computableIterable: IterableIterator<CellValue>): IterableIterator<CellValue> {
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

export function reduceSum(iterable: IterableIterator<CellValue>): CellValue {
  let acc: CellValue = 0
  for (const val of iterable) {
    acc = add(acc, val)
  }
  return acc
}

export function zip<T, U>(arr1: T[], arr2: U[]): Array<[T, U]> {
  const result: Array<[T, U]> = []
  for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    result.push([arr1[i], arr2[i]])
  }
  return result
}
