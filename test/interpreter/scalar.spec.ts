import {add} from '../../src/interpreter/scalar'
import {cellError, ErrorType} from '../../src/Cell'

describe("add", () => {
  it("adds", () => {
    expect(add(2,3)).toEqual(5)
  })

  it("return error of right operand", () => {
    expect(add(2,cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it("return error of left operand if both present", () => {
    expect(add(cellError(ErrorType.NA),cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.NA))
  })

  it("ignores non-numerics", () => {
    expect(add('foo', 5)).toEqual(5)
    expect(add(5, 'foo')).toEqual(5)
    expect(add('bar', 'foo')).toEqual(0)
  })

  it("returns 0 if only non-numerics", () => {
    expect(add('bar', 'foo')).toEqual(0)
  })
})
