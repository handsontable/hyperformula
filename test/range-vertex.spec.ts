import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {CriterionCache, RangeVertex} from '../src/DependencyGraph'
import {buildCriterionLambda, parseCriterion} from '../src/interpreter/Criterion'

describe('RangeVertex with cache', () => {
  it('cache for criterion fuctions empty', () => {
    const rangeVertex = new RangeVertex(new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 1, 10)))

    expect(rangeVertex.getCriterionFunctionValues('SUMIF,1,1').size).toBe(0)
  })

  it('cache for functions with criterion basic usage', () => {
    const rangeVertex = new RangeVertex(new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 1, 10)))

    const criterionString1 = '>=0'
    const criterion1 = buildCriterionLambda(parseCriterion(criterionString1)!)

    const criterionString2 = '=1'
    const criterion2 = buildCriterionLambda(parseCriterion(criterionString2)!)

    const criterionCache: CriterionCache = new Map()

    criterionCache.set(criterionString1, [10, criterion1])
    criterionCache.set(criterionString2, [20, criterion2])

    rangeVertex.setCriterionFunctionValues('SUMIF,1,1', criterionCache)

    expect(rangeVertex.getCriterionFunctionValues('SUMIF,1,1').size).toBe(2)
    expect(rangeVertex.getCriterionFunctionValue('SUMIF,1,1', criterionString1)).toEqual(10)
    expect(rangeVertex.getCriterionFunctionValue('SUMIF,1,1', criterionString2)).toEqual(20)
  })
})
