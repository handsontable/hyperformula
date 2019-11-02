import {EmptyValue, CellError, ErrorType} from '../../src/Cell'
import {coerceScalarToNumber} from '../../src/interpreter/coerce'
import '../testConfig'

describe("#coerceScalarToNumber", () => {
  it('works', () => {
    expect(coerceScalarToNumber(42)).toBe(42)
    expect(coerceScalarToNumber("42")).toBe(42)
    expect(coerceScalarToNumber(" 42")).toBe(42)
    expect(coerceScalarToNumber("42 ")).toBe(42)
    expect(coerceScalarToNumber("0000042")).toBe(42)
    expect(coerceScalarToNumber("42foo")).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToNumber("foo42")).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToNumber(true)).toBe(1)
    expect(coerceScalarToNumber(false)).toBe(0)
    expect(coerceScalarToNumber(EmptyValue)).toBe(0)
    expect(coerceScalarToNumber(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
