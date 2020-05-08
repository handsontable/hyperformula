type CustomMatcher = jasmine.CustomMatcher
type CustomMatcherFactories = jasmine.CustomMatcherFactories
type CustomMatcherResult = jasmine.CustomMatcherResult
type MatchersUtil = jasmine.MatchersUtil

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toContainEqual(expected: object, expectationFailOutput?: string): boolean,
    }
  }
}

export const toContainEqualMatcherJasmine: CustomMatcherFactories = {
  toContainEqual: function(util: MatchersUtil): CustomMatcher {
    return {
      compare: function(actual: never, expected: never): CustomMatcherResult {
        return {
          pass: util.equals(actual, jasmine.arrayContaining(expected))
        }
      },
    }
  }
}
