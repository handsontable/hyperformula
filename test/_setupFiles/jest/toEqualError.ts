type CustomMatcherResult = jest.CustomMatcherResult
type ExpectExtendMap = jest.ExpectExtendMap

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toEqualError(expected: any): CustomMatcherResult,
    }
  }
}

export const toEqualError: ExpectExtendMap = {toEqualError(received: any, expected: any): CustomMatcherResult {
    let result = false
    if (typeof received === 'object' && typeof expected === 'object') {
      result = this.equals(
        {...received, address: undefined},
        {...expected, address: undefined}
      )
    } else {
      result = this.equals(received, expected)
    }
    return {
      pass: result,
      message: () => (result ? '' : `Expected ${received} to be match ${expected}.`)
    }
  }
}
