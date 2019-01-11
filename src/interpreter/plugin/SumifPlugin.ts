import {cellError, cellRangeToSimpleCellRange, CellValue, ErrorType, getAbsoluteAddress, SimpleCellAddress} from '../../Cell'
import {split} from '../../generatorUtils'
import {findSmallerRange, generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {IAddressMapping} from '../../IAddressMapping'
import {AstNodeType, CellRangeAst, CellReferenceAst, ProcedureAst} from '../../parser/Ast'
import {CriterionCache, RangeVertex} from '../../Vertex'
import {buildCriterionLambda, Criterion, CriterionLambda, parseCriterion} from '../Criterion'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'

/** Computes key for criterion function cache */
function sumifCacheKey(leftCorner: SimpleCellAddress) {
  return `SUMIF,${leftCorner.col},${leftCorner.row}`
}

const COUNTIF_CACHE_KEY = 'COUNTIF'

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
      return cellError(ErrorType.VALUE)
    }

    const criterion = parseCriterion(criterionString)
    if (criterion === null) {
      return cellError(ErrorType.VALUE)
    }

    const conditionRangeArg = ast.args[0]
    const valuesRangeArg = ast.args[2]

    if (conditionRangeArg.type === AstNodeType.CELL_RANGE && valuesRangeArg.type === AstNodeType.CELL_RANGE) {
      const conditionWidth = getRangeWidth(conditionRangeArg, formulaAddress)
      const conditionHeight = getRangeHeight(conditionRangeArg, formulaAddress)
      const valuesWidth = getRangeWidth(valuesRangeArg, formulaAddress)
      const valuesHeight = getRangeHeight(valuesRangeArg, formulaAddress)

      if (conditionWidth !== valuesWidth || conditionHeight !== valuesHeight) {
        return cellError(ErrorType.VALUE)
      }

      return this.evaluateRangeSumif(conditionRangeArg, valuesRangeArg, formulaAddress, criterionString, criterion)
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE && valuesRangeArg.type === AstNodeType.CELL_REFERENCE) {
      return this.evaluateCellSumif(ast, formulaAddress, criterion)
    } else {
      return cellError(ErrorType.VALUE)
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
      return cellError(ErrorType.VALUE)
    }

    const criterion = parseCriterion(criterionString)
    if (criterion === null) {
      return cellError(ErrorType.VALUE)
    }

    const criterionLambda = buildCriterionLambda(criterion)

    if (conditionRangeArg.type === AstNodeType.CELL_RANGE) {
      return this.evaluateRangeCountif(conditionRangeArg, formulaAddress, criterionString, criterion)
    } else if (conditionRangeArg.type === AstNodeType.CELL_REFERENCE) {
      const valueFromCellReference = this.evaluateAst(conditionRangeArg, formulaAddress)
      const criterionResult = criterionLambda(valueFromCellReference)
      if (criterionResult) {
        return 1
      } else {
        return 0
      }
    } else {
      return cellError(ErrorType.VALUE)
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
   * @param ast - ast of the SUMIF function call
   * @param formulaAddress - address of the cell with function call
   * @param criterionString - raw value of the criterion passed to function call
   * @param criterion - computed value of the criterion passed to function call
   */
  private evaluateRangeSumif(conditionRangeArg: CellRangeAst, valuesRangeArg: CellRangeAst, formulaAddress: SimpleCellAddress, criterionString: string, criterion: Criterion): CellValue {
    const simpleValuesRange = cellRangeToSimpleCellRange(valuesRangeArg, formulaAddress)
    const conditionRangeStart = getAbsoluteAddress(conditionRangeArg.start, formulaAddress)

    const valuesRangeVertex = this.rangeMapping.getRange(simpleValuesRange.start, simpleValuesRange.end)
    if (!valuesRangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let rangeValue = this.findAlreadyComputedValueInCache(valuesRangeVertex, sumifCacheKey(conditionRangeStart), criterionString)
    if (rangeValue) {
      return rangeValue
    }

    const [smallerCache, values] = this.getCriterionRangeValues(sumifCacheKey(conditionRangeStart), simpleValuesRange.start, simpleValuesRange.end)

    const conditions = getPlainRangeValues(this.addressMapping, conditionRangeArg, formulaAddress)
    const restConditions = conditions.slice(conditions.length - values.length)

    /* copy old cache and actualize values */
    const cache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambda]: [CellValue, CriterionLambda], key: string) => {
      const filteredValues = ifFilter(criterionLambda, restConditions[Symbol.iterator](), values[Symbol.iterator]())
      let reducedSum = reduceSum(filteredValues)
      reducedSum = add(reducedSum, value)
      cache.set(key, [reducedSum, criterionLambda])
    })
    if (cache.has(criterionString)) {
      return cache.get(criterionString)![0]
    }

    /* if there was no previous value for this criterion, we need to calculate it from scratch */
    const criterionLambda = buildCriterionLambda(criterion)
    const allValues = getPlainRangeValues(this.addressMapping, valuesRangeArg, formulaAddress)

    const filteredValues = ifFilter(criterionLambda, conditions[Symbol.iterator](), allValues[Symbol.iterator]())
    const reducedSum = reduceSum(filteredValues)
    cache.set(criterionString, [reducedSum, criterionLambda])

    rangeValue = reducedSum
    valuesRangeVertex.setCriterionFunctionValues(sumifCacheKey(conditionRangeStart), cache)

    return rangeValue
  }

  private evaluateRangeCountif(conditionRangeArg: CellRangeAst, formulaAddress: SimpleCellAddress, criterionString: string, criterion: Criterion): CellValue {
    const simpleConditionRange = cellRangeToSimpleCellRange(conditionRangeArg, formulaAddress)
    const conditionRangeVertex = this.rangeMapping.getRange(simpleConditionRange.start, simpleConditionRange.end)
    if (!conditionRangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let rangeValue = this.findAlreadyComputedValueInCache(conditionRangeVertex, COUNTIF_CACHE_KEY, criterionString)
    if (rangeValue) {
      return rangeValue
    }

    const [smallerCache, values] = this.getCriterionRangeValues(COUNTIF_CACHE_KEY, simpleConditionRange.start, simpleConditionRange.end)

    /* copy old cache and actualize values */
    const cache: CriterionCache = new Map()
    smallerCache.forEach(([value, criterionLambda]: [CellValue, CriterionLambda], key: string) => {
      const filteredValues = ifFilter(criterionLambda, values[Symbol.iterator](), values[Symbol.iterator]())
      const newCount = (value as number) + Array.from(filteredValues).length
      cache.set(key, [newCount, criterionLambda])
    })

    if (cache.has(criterionString)) {
      return cache.get(criterionString)![0]
    }

    /* if there was no previous value for this criterion, we need to calculate it from scratch */
    const criterionLambda = buildCriterionLambda(criterion)
    const allValues = getPlainRangeValues(this.addressMapping, conditionRangeArg, formulaAddress)

    const filteredValues = ifFilter(criterionLambda, allValues[Symbol.iterator](), allValues[Symbol.iterator]())

    rangeValue = 0
    for (const e of filteredValues) {
      if (criterionLambda(e)) {
        rangeValue++
      }
    }
    cache.set(criterionString, [rangeValue, criterionLambda])

    conditionRangeVertex.setCriterionFunctionValues(COUNTIF_CACHE_KEY, cache)
    return rangeValue
  }

  /**
   * Finds existing CriterionCache or returns fresh one and fetch list of remaining values.
   *
   * @param cacheKey - key to retrieve from cache
   * @param beginRange - top-left corner of computing range
   * @param endRange - bottom-right corner of computing range
   */
  private getCriterionRangeValues(cacheKey: string, beginRange: SimpleCellAddress, endRange: SimpleCellAddress): [CriterionCache, CellValue[]] {
    const currentRangeVertex = this.rangeMapping.getRange(beginRange, endRange)!
    const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.rangeMapping, beginRange, endRange)

    let smallerRangeResult = null
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      smallerRangeResult = smallerRangeVertex.getCriterionFunctionValues(cacheKey)
    }

    if (smallerRangeVertex !== null) {
      beginRange = restRangeStart
      endRange = restRangeEnd
    }

    const rangeResult = []
    for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
      rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
    }

    return [smallerRangeResult || new Map(), rangeResult]
  }

  private findAlreadyComputedValueInCache(rangeVertex: RangeVertex, cacheKey: string, criterionString: string) {
    return rangeVertex.getCriterionFunctionValue(cacheKey, criterionString)
  }
}

export function getPlainRangeValues(addressMapping: IAddressMapping, ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellValue[] {
  const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
  const result: CellValue[] = []
  for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
    result.push(addressMapping.getCell(cellFromRange)!.getCellValue())
  }
  return result
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

const getRangeWidth = (ast: CellRangeAst, baseAddress: SimpleCellAddress) => {
  const absoluteStart = getAbsoluteAddress(ast.start, baseAddress)
  const absoluteEnd = getAbsoluteAddress(ast.end, baseAddress)
  return absoluteEnd.col - absoluteStart.col
}

const getRangeHeight = (ast: CellRangeAst, baseAddress: SimpleCellAddress) => {
  const absoluteStart = getAbsoluteAddress(ast.start, baseAddress)
  const absoluteEnd = getAbsoluteAddress(ast.end, baseAddress)
  return absoluteEnd.row - absoluteStart.row
}
