import {EmptyValue, CellError, ErrorType} from '../../src/Cell'
import {coerceScalarToNumber, coerceScalarToBoolean, dateNumberRepresentation} from '../../src/interpreter/coerce'
import {Config} from '../../src'
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

describe("#coerceScalarToBoolean", () => {
  it('works', () => {
    expect(coerceScalarToBoolean(true)).toBe(true)
    expect(coerceScalarToBoolean(false)).toBe(false)

    expect(coerceScalarToBoolean(1)).toBe(true)
    expect(coerceScalarToBoolean(0)).toBe(false)
    expect(coerceScalarToBoolean(2)).toBe(true)
    expect(coerceScalarToBoolean(-1)).toBe(true)

    expect(coerceScalarToBoolean("false")).toBe(false)
    expect(coerceScalarToBoolean("FALSE")).toBe(false)
    expect(coerceScalarToBoolean("true")).toBe(true)
    expect(coerceScalarToBoolean("TRUE")).toBe(true)
    expect(coerceScalarToBoolean(" ")).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToBoolean(" true")).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToBoolean("true ")).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToBoolean("prawda")).toEqual(new CellError(ErrorType.VALUE))

    expect(coerceScalarToBoolean(EmptyValue)).toBe(false)

    expect(coerceScalarToBoolean(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})

describe("#dateNumberRepresentation", () => {
  it('works', () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(dateNumberRepresentation(1, defaultFormat)).toEqual(1)

    expect(dateNumberRepresentation(new CellError(ErrorType.DIV_BY_ZERO), defaultFormat)).toEqual(new CellError(ErrorType.DIV_BY_ZERO))

    expect(dateNumberRepresentation("12/31/1899", defaultFormat)).toEqual(1)
    expect(dateNumberRepresentation(true, defaultFormat)).toEqual(1)

    expect(dateNumberRepresentation("foo42", defaultFormat)).toEqual(new CellError(ErrorType.VALUE))
  })

  xit("incompatibility to fix", () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(dateNumberRepresentation("1", defaultFormat)).toEqual(1)
  })
})
