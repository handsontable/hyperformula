import {RangeVertex} from "../src/Vertex";
import {simpleCellAddress} from "../src/Cell";
import {parseCriterion} from "../src/interpreter/Criterion";

describe('RangeVertex with cache', () => {
  it('cache for criterion fuctions empty', () => {
    const rangeVertex = new RangeVertex(simpleCellAddress(1,1), simpleCellAddress(1,10));

    expect(rangeVertex.getCriterionFunctionValues("SUMIF", simpleCellAddress(1,1)).size).toBe(0)
  })

  it('cache for functions with criterion basic usage', () => {
    const rangeVertex = new RangeVertex(simpleCellAddress(1,1), simpleCellAddress(1,10));

    const criterionString1 = '>=0'
    const criterion1 = parseCriterion(criterionString1)!

    const criterionString2 = '=1'
    const criterion2 = parseCriterion(criterionString2)!

    rangeVertex.setCriterionFunctionValue("SUMIF", simpleCellAddress(1,1), criterionString1, criterion1, 10)
    rangeVertex.setCriterionFunctionValue("SUMIF", simpleCellAddress(1,1), criterionString2, criterion2, 20)

    expect(rangeVertex.getCriterionFunctionValues("SUMIF", simpleCellAddress(1,1)).size).toBe(2)
    expect(rangeVertex.getCriterionFunctionValue("SUMIF", simpleCellAddress(1,1), criterionString1)).toEqual([10, criterion1])
    expect(rangeVertex.getCriterionFunctionValue("SUMIF", simpleCellAddress(1,1), criterionString2)).toEqual([20, criterion2])
  })
})