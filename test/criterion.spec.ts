import {ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
import {DateTimeHelper} from '../src/DateTimeHelper'
import {ArithmeticHelper} from '../src/interpreter/ArithmeticHelper'
import {buildCriterion, CriterionType, parseCriterion} from '../src/interpreter/Criterion'
import {NumberLiteralHelper} from '../src/NumberLiteralHelper'
import {detailedError} from './testUtils'

describe('Criterion', () => {
  const config = new Config()
  const dateTimeHelper = new DateTimeHelper(config)
  const numberLiteralsHelper = new NumberLiteralHelper(config)
  const arithmeticHelper = new ArithmeticHelper(config, dateTimeHelper, numberLiteralsHelper)
  it('greater than', () => {
    expect(parseCriterion('>0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.GREATER_THAN, 0))
  })

  it('greater or equal than', () => {
    expect(parseCriterion('>=0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 0))
  })

  it('less than', () => {
    expect(parseCriterion('<0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.LESS_THAN, 0))
  })

  it('less or equal than', () => {
    expect(parseCriterion('<=0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, 0))
  })

  it('not equal', () => {
    expect(parseCriterion('<>0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.NOT_EQUAL, 0))
  })

  it('equal', () => {
    expect(parseCriterion('=0', arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, 0))
  })

  it('works with bigger number', () => {
    expect(parseCriterion('>=123', arithmeticHelper)).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 123))
  })

  it('works with negative numbers', () => {
    expect(parseCriterion('>=-123', arithmeticHelper)).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, -123))
  })

  it('works with floats', () => {
    expect(parseCriterion('>=100.5', arithmeticHelper)).toEqual(buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, 100.5))
  })

  it('works with strings', () => {
    expect(parseCriterion('=asdf', arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, 'asdf'))
  })

  it('works with empty string', () => {
    expect(parseCriterion('=', arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, null))
  })

  it('null when unknown operator', () => {
    expect(parseCriterion('><0', arithmeticHelper)).toEqual(undefined)
  })

  it('defaults to equal when unparsable string', () => {
    expect(parseCriterion('$fdsa', arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, '$fdsa'))
  })

  xit('defaults to equal when string with weirdly used operators', () => {
    // not sure what should happen here
    expect(parseCriterion('><fdsa', arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, '><fdsa'))
  })

  it('null when criterion being error', () => {
    expect(parseCriterion(detailedError(ErrorType.VALUE), arithmeticHelper)).toEqual(undefined)
  })

  it('works with criterion being just value', () => {
    expect(parseCriterion(100.5, arithmeticHelper)).toEqual(buildCriterion(CriterionType.EQUAL, 100.5))
  })
})
