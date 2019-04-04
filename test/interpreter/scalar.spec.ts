import {cellError, ErrorType} from '../../src/Cell'
import {add, addStrict} from '../../src/interpreter/scalar'
import '../testConfig'

describe('add', () => {
  it('adds', () => {
    expect(add(2, 3)).toEqual(5)
  })

  it('return error of right operand', () => {
    expect(add(2, cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(add(cellError(ErrorType.NA), cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.NA))
  })

  it('ignores non-numerics', () => {
    expect(add('foo', 5)).toEqual(5)
    expect(add(5, 'foo')).toEqual(5)
    expect(add('bar', 'foo')).toEqual(0)
  })

  it('returns 0 if only non-numerics', () => {
    expect(add('bar', 'foo')).toEqual(0)
  })
})

describe('addStrict', () => {
  it('adds', () => {
    expect(addStrict(2, 3)).toEqual(5)
  })

  it('return error of right operand', () => {
    expect(addStrict(2, cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(addStrict(cellError(ErrorType.NA), cellError(ErrorType.DIV_BY_ZERO))).toEqual(cellError(ErrorType.NA))
  })

  it('error when non-numerics', () => {
    expect(addStrict('foo', 5)).toEqual(cellError(ErrorType.VALUE))
    expect(addStrict(5, 'foo')).toEqual(cellError(ErrorType.VALUE))
    expect(addStrict('bar', 'foo')).toEqual(cellError(ErrorType.VALUE))
  })
})
