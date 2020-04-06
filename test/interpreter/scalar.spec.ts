import {CellError, ErrorType} from '../../src'
import {Config} from '../../src/Config'
import {DateHelper} from '../../src/DateHelper'
import {ArithmeticHelper, max, min} from '../../src/interpreter/ArithmeticHelper'
import {NumberLiteralHelper} from '../../src/NumberLiteralHelper'

describe('nonstrictadd', () => {
  const config = new Config()
  const dateHelper = new DateHelper(config)
  const numberLiteralsHelper = new NumberLiteralHelper(config)
  const arithmeticHelper = new ArithmeticHelper(config, dateHelper, numberLiteralsHelper)
  it('adds', () => {
    expect(arithmeticHelper.nonstrictadd(2, 3)).toEqual(5)
  })

  it('return error of right operand', () => {
    expect(arithmeticHelper.nonstrictadd(2, new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(arithmeticHelper.nonstrictadd(new CellError(ErrorType.NA), new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.NA))
  })

  it('ignores non-numerics', () => {
    expect(arithmeticHelper.nonstrictadd('foo', 5)).toEqual(5)
    expect(arithmeticHelper.nonstrictadd(5, 'foo')).toEqual(5)
    expect(arithmeticHelper.nonstrictadd('bar', 'foo')).toEqual(0)
  })

  it('returns 0 if only non-numerics', () => {
    expect(arithmeticHelper.nonstrictadd('bar', 'foo')).toEqual(0)
  })
})

describe('max', () => {
  it('max', () => {
    expect(max(2, 3)).toEqual(3)
  })

  it('return error of right operand', () => {
    expect(max(2, new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(max(new CellError(ErrorType.NA), new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.NA))
  })

  it('ignores non-numerics', () => {
    expect(max('foo', 5)).toEqual(5)
    expect(max(5, 'foo')).toEqual(5)
  })

  it('returns negative infinity if only non-numerics', () => {
    expect(max('bar', 'foo')).toEqual(Number.NEGATIVE_INFINITY)
  })
})

describe('min', () => {
  it('min', () => {
    expect(min(2, 3)).toEqual(2)
  })

  it('return error of right operand', () => {
    expect(min(2, new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(min(new CellError(ErrorType.NA), new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.NA))
  })

  it('ignores non-numerics', () => {
    expect(min('foo', 5)).toEqual(5)
    expect(min(-5, 'foo')).toEqual(-5)
  })

  it('returns positive infinity if only non-numerics', () => {
    expect(min('bar', 'foo')).toEqual(Number.POSITIVE_INFINITY)
  })
})
