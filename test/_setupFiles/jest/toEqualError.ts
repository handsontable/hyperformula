import { cellErrorMismatchMessage, cellErrorsMatch } from '../matchers/cellErrorComparison'

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
    const result = cellErrorsMatch(received, expected, (a, b) => this.equals(a, b))
    return {
      pass: result,
      message: () => (result ? '' : cellErrorMismatchMessage(received, expected))
    }
  }
}
