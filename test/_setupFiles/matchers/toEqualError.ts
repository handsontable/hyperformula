import { cellErrorMismatchMessage, cellErrorsMatch } from './cellErrorComparison'

type CustomMatcher = jasmine.CustomMatcher
type CustomMatcherFactories = jasmine.CustomMatcherFactories
type CustomMatcherResult = jasmine.CustomMatcherResult
type MatchersUtil = jasmine.MatchersUtil

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toEqualError(expected: any, expectationFailOutput?: string): boolean,
    }
  }
}

export const toEqualErrorMatcher: CustomMatcherFactories = {
  toEqualError: function(util: MatchersUtil): CustomMatcher {
    return {
      compare: function(received: any, expected: any): CustomMatcherResult {
        const result = cellErrorsMatch(received, expected, (a, b) => util.equals(a, b))
        return {
          pass: result,
          message: result ? '' : cellErrorMismatchMessage(received, expected)
        }
      },
    }
  }
}
