import {DetailedCellError} from '../../../src'
import {CellError} from '../../../src/Cell'

type CustomMatcher = jasmine.CustomMatcher
type CustomMatcherFactories = jasmine.CustomMatcherFactories
type CustomMatcherResult = jasmine.CustomMatcherResult
type MatchersUtil = jasmine.MatchersUtil

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toEqualError(expected: object, expectationFailOutput?: string): boolean,
    }
  }
}

export const toEqualErrorMatcherJasmine: CustomMatcherFactories = {
  toEqualError: function(util: MatchersUtil): CustomMatcher {
    return {
      compare: function(received: any, expected: any): CustomMatcherResult {
        let localRec = received
        if(received instanceof CellError || received instanceof DetailedCellError) {
          localRec = {...received}
          localRec.address = undefined
        }
        let localExp = expected
        if(expected instanceof CellError || expected instanceof DetailedCellError) {
          localExp = {...expected}
          localExp.address = undefined
        }
        return {
          pass: util.equals(received, expected),
          message: ''
        }
      },
    }
  }
}
