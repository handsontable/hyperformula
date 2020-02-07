import {Config} from '../../src'
import {CellError, EmptyValue, ErrorType} from '../../src/Cell'
import {DateHelper} from '../../src/DateHelper'
import {
  coerceBooleanToNumber,
  coerceScalarToBoolean,
  coerceScalarToString,
  coerceScalarToNumber,
  coerceNonDateScalarToMaybeNumber
} from '../../src/interpreter/coerce'
import '../testConfig'

describe('#coerceNonDateScalarToMaybeNumber', () => {
  it('works', () => {
    expect(coerceNonDateScalarToMaybeNumber(42)).toBe(42)
    expect(coerceNonDateScalarToMaybeNumber('42')).toBe(42)
    expect(coerceNonDateScalarToMaybeNumber(' 42')).toBe(42)
    expect(coerceNonDateScalarToMaybeNumber('42 ')).toBe(42)
    expect(coerceNonDateScalarToMaybeNumber('0000042')).toBe(42)
    expect(coerceNonDateScalarToMaybeNumber('42foo')).toEqual(null)
    expect(coerceNonDateScalarToMaybeNumber('foo42')).toEqual(null)
    expect(coerceNonDateScalarToMaybeNumber(true)).toBe(1)
    expect(coerceNonDateScalarToMaybeNumber(false)).toBe(0)
    expect(coerceNonDateScalarToMaybeNumber(EmptyValue)).toBe(0)
    expect(coerceNonDateScalarToMaybeNumber(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})

describe('#coerceBooleanToNumber', () => {
  it('works', () => {
    expect(coerceBooleanToNumber(true)).toBe(1)
    expect(coerceBooleanToNumber(false)).toBe(0)
  })

  it('behaves the same as more general coercion', () => {
    const dateHelper = new DateHelper(new Config())
    expect(coerceBooleanToNumber(true)).toBe(coerceScalarToNumber(true, dateHelper))
    expect(coerceBooleanToNumber(false)).toBe(coerceScalarToNumber(false, dateHelper))
  })
})

describe('#coerceScalarToBoolean', () => {
  it('works', () => {
    expect(coerceScalarToBoolean(true)).toBe(true)
    expect(coerceScalarToBoolean(false)).toBe(false)

    expect(coerceScalarToBoolean(1)).toBe(true)
    expect(coerceScalarToBoolean(0)).toBe(false)
    expect(coerceScalarToBoolean(2)).toBe(true)
    expect(coerceScalarToBoolean(-1)).toBe(true)

    expect(coerceScalarToBoolean('false')).toBe(false)
    expect(coerceScalarToBoolean('FALSE')).toBe(false)
    expect(coerceScalarToBoolean('true')).toBe(true)
    expect(coerceScalarToBoolean('TRUE')).toBe(true)
    expect(coerceScalarToBoolean(' ')).toBe(null)
    expect(coerceScalarToBoolean(' true')).toBe(null)
    expect(coerceScalarToBoolean('true ')).toBe(null)
    expect(coerceScalarToBoolean('prawda')).toBe(null)

    expect(coerceScalarToBoolean(EmptyValue)).toBe(false)

    expect(coerceScalarToBoolean(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})

describe('#coerceScalarToNumber', () => {
  it('works', () => {
    const dateHelper = new DateHelper(new Config())
    expect(coerceScalarToNumber(1, dateHelper)).toEqual(1)

    expect(coerceScalarToNumber(new CellError(ErrorType.DIV_BY_ZERO), dateHelper)).toEqual(new CellError(ErrorType.DIV_BY_ZERO))

    expect(coerceScalarToNumber('12/31/1899', dateHelper)).toEqual(1)
    expect(coerceScalarToNumber(true, dateHelper)).toEqual(1)

    expect(coerceScalarToNumber('foo42', dateHelper)).toEqual(new CellError(ErrorType.VALUE))

    expect(coerceScalarToNumber('1', dateHelper)).toEqual(1)
  })

})

describe('#coerceScalarToString', () => {
  it('works', () => {
    expect(coerceScalarToString(true)).toBe('TRUE')
    expect(coerceScalarToString(false)).toBe('FALSE')

    expect(coerceScalarToString(1)).toBe('1')
    expect(coerceScalarToString(0)).toBe('0')
    expect(coerceScalarToString(2)).toBe('2')
    expect(coerceScalarToString(-1)).toBe('-1')

    expect(coerceScalarToString('foo')).toBe('foo')

    expect(coerceScalarToString(EmptyValue)).toBe('')

    expect(coerceScalarToString(1.42)).toBe('1.42')

    expect(coerceScalarToString(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
