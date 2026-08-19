type CustomMatcher = jasmine.CustomMatcher
type CustomMatcherFactories = jasmine.CustomMatcherFactories
type CustomMatcherResult = jasmine.CustomMatcherResult
type MatchersUtil = jasmine.MatchersUtil

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toMatchObject(expected: object, expectationFailOutput?: string): boolean,
    }
  }
}

export const toMatchObjectMatcher: CustomMatcherFactories = {
  toMatchObject: function(util: MatchersUtil): CustomMatcher {
    return {
      compare: function(actual: never, expected: never): CustomMatcherResult {
        return {
          pass: util.equals(actual, jasmine.objectContaining(expected)),
          message: ''
        }
      },
    }
  }
}
