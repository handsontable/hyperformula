import {parseCriterion, buildCriterion, CriterionType} from '../src/interpreter/Criterion'

describe('Criterion', () => {
  it('greater than', () => {
    expect(parseCriterion(">0")).toEqual(buildCriterion(CriterionType.GREATER_THAN, 0))
  })
})
