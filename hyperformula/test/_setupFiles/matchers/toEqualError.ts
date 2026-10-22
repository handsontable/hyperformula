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
        let result
        if (typeof received === 'object' && typeof expected === 'object' && received.message != null && expected.message != null && received.message.includes(expected.message)) {
          result = util.equals(
            {...received, message: undefined, root: undefined, address: undefined},
            {...expected, message: undefined, root: undefined, address: undefined}
          )
        } else {
          result = util.equals(received, expected)
        }
        return {
          pass: result,
          message: result ? '' : `Expected ${JSON.stringify(received, null, 2)} to match ${JSON.stringify(expected, null, 2)}.`
        }
      },
    }
  }
}
