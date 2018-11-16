import {buildCriterion, CriterionType, parseCriterion} from '../src/interpreter/Criterion'

describe('Criterion', () => {
  it('greater than', () => {
    expect(parseCriterion('>0')).toEqual(buildCriterion(CriterionType.GREATER_THAN, 0))
  })

  it('greater or equal than', () => {
    expect(parseCriterion('>=0')).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 0))
  })

  it('less than', () => {
    expect(parseCriterion('<0')).toEqual(buildCriterion(CriterionType.LESS_THAN, 0))
  })

  it('less or equal than', () => {
    expect(parseCriterion('<=0')).toEqual(buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, 0))
  })

  it('not equal', () => {
    expect(parseCriterion('<>0')).toEqual(buildCriterion(CriterionType.NOT_EQUAL, 0))
  })

  it('equal', () => {
    expect(parseCriterion('=0')).toEqual(buildCriterion(CriterionType.EQUAL, 0))
  })
})
