import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {AddressMapping} from '../../AddressMapping'
import {
  CellError,
  CellValue,
  ErrorType,
  simpleCellAddress,
  SimpleCellAddress,
} from '../../Cell'
import {count, split} from '../../generatorUtils'
import {AstNodeType, CellReferenceAst, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {CriterionCache, RangeVertex} from '../../Vertex'
import {buildCriterionLambda, Criterion, CriterionLambda, parseCriterion} from '../Criterion'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import assert from 'assert';

/** Computes key for criterion function cache */
function sumifCacheKey(simpleConditionRange: AbsoluteCellRange): string {
  return `SUMIF,${simpleConditionRange.start.col},${simpleConditionRange.start.row}`
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
export const findSmallerRange = (rangeMapping: RangeMapping, conditionRange: AbsoluteCellRange, valuesRange: AbsoluteCellRange): {smallerRangeVertex: RangeVertex | null, restConditionRange: AbsoluteCellRange, restValuesRange: AbsoluteCellRange} => {
  if (valuesRange.end.row > valuesRange.start.row) {
    const valuesRangeEndRowLess = simpleCellAddress(valuesRange.end.sheet, valuesRange.end.col, valuesRange.end.row - 1)
    const rowLessVertex = rangeMapping.getRange(valuesRange.start, valuesRangeEndRowLess)
    if (rowLessVertex) {
      return {
        smallerRangeVertex: rowLessVertex,
        restValuesRange: valuesRange.withStart(simpleCellAddress(valuesRange.start.sheet, valuesRange.start.col, valuesRange.end.row)),
        restConditionRange: conditionRange.withStart(simpleCellAddress(conditionRange.start.sheet, conditionRange.start.col, conditionRange.end.row)),
      }
    }
  }
  return {
    smallerRangeVertex: null,
    restValuesRange: valuesRange,
    restConditionRange: conditionRange,
  }
}

type CacheBuildingFunction = (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => CellValue

export class SumifPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sumif: {
      EN: 'SUMIF',
      PL: 'SUMAJEZELI',
    },
    countif: {
      EN: 'COUNTIF',
      PL: 'LICZJEZELI',
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

      if (!simpleConditionRange.sameDimensionsAs(simpleValuesRange)) {
        return new CellError(ErrorType.VALUE)
      }

      return this.evaluateRangeSumif(simpleConditionRange, simpleValuesRange, criterionString, criterion)
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE && valuesRangeArg.type === AstNodeType.CELL_REFERENCE) {
      return this.evaluateCellSumif(ast, formulaAddress, criterion)
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

  /**
   * Computes SUMIF function for single-cell arguments
   *
   * @param ast - ast of the SUMIF function call
   * @param formulaAddress - address of the cell with function call
   * @param criterion - computed value of the criterion passed to function call
   */
  private evaluateCellSumif(ast: ProcedureAst, formulaAddress: SimpleCellAddress, criterion: Criterion): CellValue {
    const conditionReferenceArg = ast.args[0] as CellReferenceAst
    const valuesReferenceArg = ast.args[2] as CellReferenceAst

    const conditionValues = [this.evaluateAst(conditionReferenceArg, formulaAddress)][Symbol.iterator]()
    const computableValues = [this.evaluateAst(valuesReferenceArg, formulaAddress)][Symbol.iterator]()
    const criterionLambda = buildCriterionLambda(criterion)
    const filteredValues = ifFilter(criterionLambda, conditionValues, computableValues)
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
  private evaluateRangeSumif(simpleConditionRange: AbsoluteCellRange, simpleValuesRange: AbsoluteCellRange, criterionString: string, criterion: Criterion): CellValue {
    const valuesRangeVertex = this.rangeMapping.getRange(simpleValuesRange.start, simpleValuesRange.end)!
    assert.ok(valuesRangeVertex, 'Range does not exists in graph')

    const cachedResult = this.findAlreadyComputedValueInCache(valuesRangeVertex, sumifCacheKey(simpleConditionRange), criterionString)
    if (cachedResult) {
      this.interpreter.stats.sumifFullCacheUsed++
      return cachedResult
    }

    const cache = this.buildNewCriterionCache(sumifCacheKey(simpleConditionRange), simpleConditionRange, simpleValuesRange,
      (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => {
        return add(cacheCurrentValue, reduceSum(newFilteredValues))
      })

    if (!cache.has(criterionString)) {
      const resultValue = this.computeCriterionValue(criterion, simpleConditionRange, simpleValuesRange,
        (filteredValues: IterableIterator<CellValue>) => {
          return reduceSum(filteredValues)
        })
      cache.set(criterionString, [resultValue, buildCriterionLambda(criterion)])
    }

    valuesRangeVertex.setCriterionFunctionValues(sumifCacheKey(simpleConditionRange), cache)

    return cache.get(criterionString)![0]
  }

  /**
   * Computes COUNTIF function for range arguments.
   *
   * @param simpleConditionRange - condition range
   * @param criterionString - criterion in raw string format
   * @param criterion - already parsed criterion structure
   */
  private evaluateRangeCountif(simpleConditionRange: AbsoluteCellRange, criterionString: string, criterion: Criterion): CellValue {
    const conditionRangeVertex = this.rangeMapping.getRange(simpleConditionRange.start, simpleConditionRange.end)!
    assert.ok(conditionRangeVertex, 'Range does not exists in graph')

    const cachedResult = this.findAlreadyComputedValueInCache(conditionRangeVertex, COUNTIF_CACHE_KEY, criterionString)
    if (cachedResult) {
      this.interpreter.stats.countifFullCacheUsed++
      return cachedResult
    }

    const cache = this.buildNewCriterionCache(COUNTIF_CACHE_KEY, simpleConditionRange, simpleConditionRange,
      (cacheKey: string, cacheCurrentValue: CellValue, newFilteredValues: IterableIterator<CellValue>) => {
        this.interpreter.stats.countifPartialCacheUsed++
        return (cacheCurrentValue as number) + count(newFilteredValues)
      })

    if (!cache.has(criterionString)) {
      const resultValue = this.computeCriterionValue(criterion, simpleConditionRange, simpleConditionRange,
        (filteredValues: IterableIterator<CellValue>) => {
          return count(filteredValues)
        })
      cache.set(criterionString, [resultValue, buildCriterionLambda(criterion)])
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
  private buildNewCriterionCache(cacheKey: string, simpleConditionRange: AbsoluteCellRange, simpleValuesRange: AbsoluteCellRange, cacheBuilder: CacheBuildingFunction): CriterionCache {
    const currentRangeVertex = this.rangeMapping.getRange(simpleValuesRange.start, simpleValuesRange.end)!
    const {smallerRangeVertex, restConditionRange, restValuesRange} = findSmallerRange(this.rangeMapping, simpleConditionRange, simpleValuesRange)

    let smallerCache
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      smallerCache = smallerRangeVertex.getCriterionFunctionValues(cacheKey)
    } else {
      smallerCache = new Map()
    }

    const newCache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambda]: [CellValue, CriterionLambda], key: string) => {
      const filteredValues = ifFilter(criterionLambda, getRangeValues(this.addressMapping, restConditionRange), getRangeValues(this.addressMapping, restValuesRange))
      const newCacheValue = cacheBuilder(key, value, filteredValues)
      newCache.set(key, [newCacheValue, criterionLambda])
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
  private computeCriterionValue(criterion: Criterion, simpleConditionRange: AbsoluteCellRange, simpleValuesRange: AbsoluteCellRange, valueComputingFunction: ((filteredValues: IterableIterator<CellValue>) => (CellValue))) {
    const criterionLambda = buildCriterionLambda(criterion)
    const values = getRangeValues(this.addressMapping, simpleValuesRange)
    const conditions = getRangeValues(this.addressMapping, simpleConditionRange)
    const filteredValues = ifFilter(criterionLambda, conditions, values)
    return valueComputingFunction(filteredValues)
  }
}

function * getRangeValues(addressMapping: AddressMapping, cellRange: AbsoluteCellRange): IterableIterator<CellValue> {
  for (const cellFromRange of cellRange.generateCellsFromRangeGenerator()) {
    yield addressMapping.getCellValue(cellFromRange)
  }
}

export function* ifFilter(criterionLambda: CriterionLambda, conditionalIterable: IterableIterator<CellValue>, computableIterable: IterableIterator<CellValue>): IterableIterator<CellValue> {
  const conditionalSplit = split(conditionalIterable)
  const computableSplit = split(computableIterable)
  if (conditionalSplit.hasOwnProperty('value') && computableSplit.hasOwnProperty('value')) {
    const conditionalFirst = conditionalSplit.value as CellValue
    const computableFirst = computableSplit.value as CellValue
    if (criterionLambda(conditionalFirst)) {
      yield computableFirst
    }

    yield* ifFilter(criterionLambda, conditionalSplit.rest, computableSplit.rest)
  }
}

export function reduceSum(iterable: IterableIterator<CellValue>): CellValue {
  let acc: CellValue = 0
  for (const val of iterable) {
    acc = add(acc, val)
  }
  return acc
}
