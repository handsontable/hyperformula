type CustomMatcherResult = jest.CustomMatcherResult
type ExpectExtendMap = jest.ExpectExtendMap

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toEqualError(expected: any): CustomMatcherResult,
    }
  }
}

export const toEqualError: ExpectExtendMap = {
  toEqualError(received: any, expected: any): CustomMatcherResult {
    let result = false

    if (typeof received === 'object' && typeof expected === 'object' && received.message != null && expected.message != null && received.message.includes(expected.message)) {
      result = this.equals(
        {...received, message: undefined, root: undefined, address: undefined},
        {...expected, message: undefined, root: undefined, address: undefined}
      )
    } else {
      result = this.equals(received, expected)
    }
    return {
      pass: result,
      message: () => (result ? '' : `Expected ${JSON.stringify(received, null, 2)} to match ${JSON.stringify(expected, null, 2)}.`)
    }
  }
}
