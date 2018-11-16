import {buildCriterion, CriterionType, parseCriterion} from '../src/interpreter/Criterion'

describe('Criterion', () => {
  it('greater than', () => {
    expect(parseCriterion('>0')).toEqual(buildCriterion(CriterionType.GREATER_THAN, 0))
  })

  it('greater or equal than', () => {
    expect(parseCriterion('>=0')).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 0))
  })
})
