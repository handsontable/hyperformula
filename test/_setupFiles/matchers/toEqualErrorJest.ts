import {DetailedCellError} from '../../../src'
import {CellError} from '../../../src/Cell'

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toEqualError(expected: any): CustomMatcherResult,
    }
  }
}

export const toEqualMatcherJest: jest.ExpectExtendMap = {toEqualError(received: any, expected: any): jest.CustomMatcherResult {
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
  return { pass: this.equals(localRec, localExp), message: () => '' }
}}
