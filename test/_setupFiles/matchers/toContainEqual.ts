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

// function testArray(arr: unknown[], items: unknown[]) {
//   const result = items.some((value) => !arr.includes(value))

//   return !result
// }

// function testObject(base: never, fields: never) {
//   const result = Object.keys(fields).some((key) => base[key] != fields[key] && typeof base[key] !== typeof fields[key])

//   return !result
// }

export const toContainsMatcher: CustomMatcherFactories = {
  toContainEqual: function(util: MatchersUtil): CustomMatcher {
    return {
      compare: function(actual: never, expected: never): CustomMatcherResult {
        let pass = false

        if (Array.isArray(actual) && Array.isArray(expected)) {
          pass = util.equals(actual, jasmine.arrayContaining(expected))
        } else {
          pass = util.equals(actual, jasmine.objectContaining(expected))
        }

        return { pass }
      },
    }
  }
}
