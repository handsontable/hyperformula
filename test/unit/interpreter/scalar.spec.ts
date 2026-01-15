import {ErrorType} from '../../../src'
import {CellError} from '../../../src/Cell'
import {Config} from '../../../src/Config'
import {DateTimeHelper} from '../../../src/DateTimeHelper'
import {ArithmeticHelper} from '../../../src/interpreter/ArithmeticHelper'
import {NumberLiteralHelper} from '../../../src/NumberLiteralHelper'
import {isNumeric} from '../../../src/Numeric'

// Helper to convert result to number for comparison
const toNum = (result: ReturnType<ArithmeticHelper['nonstrictadd']>) => {
  if (result instanceof CellError) return result
  return isNumeric(result) ? result.toNumber() : result
}

describe('nonstrictadd', () => {
  const config = new Config()
  const dateTimeHelper = new DateTimeHelper(config)
  const numberLiteralsHelper = new NumberLiteralHelper(config)
  const arithmeticHelper = new ArithmeticHelper(config, dateTimeHelper, numberLiteralsHelper)
  it('adds', () => {
    expect(toNum(arithmeticHelper.nonstrictadd(2, 3))).toBe(5)
  })

  it('return error of right operand', () => {
    expect(arithmeticHelper.nonstrictadd(2, new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error of left operand if both present', () => {
    expect(arithmeticHelper.nonstrictadd(new CellError(ErrorType.NA), new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.NA))
  })

  it('ignores non-numerics', () => {
    expect(toNum(arithmeticHelper.nonstrictadd('foo', 5))).toBe(5)
    expect(toNum(arithmeticHelper.nonstrictadd(5, 'foo'))).toBe(5)
    expect(toNum(arithmeticHelper.nonstrictadd('bar', 'foo'))).toBe(0)
  })

  it('returns 0 if only non-numerics', () => {
    expect(toNum(arithmeticHelper.nonstrictadd('bar', 'foo'))).toBe(0)
  })
})
