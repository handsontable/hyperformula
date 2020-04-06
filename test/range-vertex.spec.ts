import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {Config} from '../src/Config'
import {DateHelper} from '../src/DateHelper'
import {CriterionCache, RangeVertex} from '../src/DependencyGraph'
import {ArithmeticHelper} from '../src/interpreter/ArithmeticHelper'
import {buildCriterionLambda, parseCriterion} from '../src/interpreter/Criterion'
import {NumberLiteralHelper} from '../src/NumberLiteralHelper'
import {adr} from './testUtils'

describe('RangeVertex with cache', () => {
  it('cache for criterion fuctions empty', () => {
    const rangeVertex = new RangeVertex(new AbsoluteCellRange(adr('B2'), adr('B11')))

    expect(rangeVertex.getCriterionFunctionValues('SUMIF,1,1').size).toBe(0)
  })

  it('cache for functions with criterion basic usage', () => {
    const config = new Config()
    const dateHelper = new DateHelper(config)
    const numberLiteralsHelper = new NumberLiteralHelper(config)
    const arithmeticHelper = new ArithmeticHelper(config, dateHelper, numberLiteralsHelper)

    const rangeVertex = new RangeVertex(new AbsoluteCellRange(adr('B2'), adr('B11')))

    const criterionString1 = '>=0'
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const criterion1 = buildCriterionLambda(parseCriterion(criterionString1)!, arithmeticHelper)

    const criterionString2 = '=1'
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const criterion2 = buildCriterionLambda(parseCriterion(criterionString2)!, arithmeticHelper)

    const criterionCache: CriterionCache = new Map()

    criterionCache.set(criterionString1, [10, [criterion1]])
    criterionCache.set(criterionString2, [20, [criterion2]])

    rangeVertex.setCriterionFunctionValues('SUMIF,1,1', criterionCache)

    expect(rangeVertex.getCriterionFunctionValues('SUMIF,1,1').size).toBe(2)
    expect(rangeVertex.getCriterionFunctionValue('SUMIF,1,1', criterionString1)).toEqual(10)
    expect(rangeVertex.getCriterionFunctionValue('SUMIF,1,1', criterionString2)).toEqual(20)
  })
})
