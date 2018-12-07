import {cellError, ErrorType} from '../src/Cell'
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

  it('works with bigger number', () => {
    expect(parseCriterion('>=123')).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 123))
  })

  it('works with negative numbers', () => {
    expect(parseCriterion('>=-123')).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, -123))
  })

  it('works with floats', () => {
    expect(parseCriterion('>=100.5')).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 100.5))
  })

  it('works with strings', () => {
    expect(parseCriterion('=asdf')).toEqual(buildCriterion(CriterionType.EQUAL, 'asdf'))
  })

  it('null when unknown operator', () => {
    expect(parseCriterion('><0')).toEqual(null)
  })

  it('null when unparsable string', () => {
    expect(parseCriterion('$fdsa')).toEqual(null)
  })

  it('null when criterion being error', () => {
    expect(parseCriterion(cellError(ErrorType.VALUE))).toEqual(null)
  })

  it('works with criterion being just value', () => {
    expect(parseCriterion(100.5)).toEqual(buildCriterion(CriterionType.EQUAL, 100.5))
  })
})
