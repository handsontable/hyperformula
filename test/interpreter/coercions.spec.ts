import {Config} from '../../src'
import {CellError, EmptyValue, ErrorType} from '../../src/Cell'
import {coerceBooleanToNumber, coerceScalarToBoolean, coerceScalarToNumber, coerceScalarToString, dateNumberRepresentation, coerceScalarToMaybeNumber} from '../../src/interpreter/coerce'
import '../testConfig'

describe('#coerceScalarToNumber', () => {
  it('works', () => {
    expect(coerceScalarToNumber(42)).toBe(42)
    expect(coerceScalarToNumber('42')).toBe(42)
    expect(coerceScalarToNumber(' 42')).toBe(42)
    expect(coerceScalarToNumber('42 ')).toBe(42)
    expect(coerceScalarToNumber('0000042')).toBe(42)
    expect(coerceScalarToNumber('42foo')).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToNumber('foo42')).toEqual(new CellError(ErrorType.VALUE))
    expect(coerceScalarToNumber(true)).toBe(1)
    expect(coerceScalarToNumber(false)).toBe(0)
    expect(coerceScalarToNumber(EmptyValue)).toBe(0)
    expect(coerceScalarToNumber(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})

describe('#coerceScalarToMaybeNumber', () => {
  it('works', () => {
    expect(coerceScalarToMaybeNumber(42)).toBe(42)
    expect(coerceScalarToMaybeNumber('42')).toBe(42)
    expect(coerceScalarToMaybeNumber(' 42')).toBe(42)
    expect(coerceScalarToMaybeNumber('42 ')).toBe(42)
    expect(coerceScalarToMaybeNumber('0000042')).toBe(42)
    expect(coerceScalarToMaybeNumber('42foo')).toEqual(null)
    expect(coerceScalarToMaybeNumber('foo42')).toEqual(null)
    expect(coerceScalarToMaybeNumber(true)).toBe(1)
    expect(coerceScalarToMaybeNumber(false)).toBe(0)
    expect(coerceScalarToMaybeNumber(EmptyValue)).toBe(0)
    expect(coerceScalarToMaybeNumber(new CellError(ErrorType.DIV_BY_ZERO))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})

describe('#coerceBooleanToNumber', () => {
  it('works', () => {
    expect(coerceBooleanToNumber(true)).toBe(1)
    expect(coerceBooleanToNumber(false)).toBe(0)
  })

  it('behaves the same as more general coercion', () => {
    expect(coerceBooleanToNumber(true)).toBe(coerceScalarToNumber(true))
    expect(coerceBooleanToNumber(false)).toBe(coerceScalarToNumber(false))
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

describe('#dateNumberRepresentation', () => {
  it('works', () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(dateNumberRepresentation(1, defaultFormat)).toEqual(1)

    expect(dateNumberRepresentation(new CellError(ErrorType.DIV_BY_ZERO), defaultFormat)).toEqual(new CellError(ErrorType.DIV_BY_ZERO))

    expect(dateNumberRepresentation('12/31/1899', defaultFormat)).toEqual(1)
    expect(dateNumberRepresentation(true, defaultFormat)).toEqual(1)

    expect(dateNumberRepresentation('foo42', defaultFormat)).toEqual(new CellError(ErrorType.VALUE))
  })

  xit('incompatibility to fix', () => {
    const defaultFormat = Config.defaultConfig.dateFormat
    expect(dateNumberRepresentation('1', defaultFormat)).toEqual(1)
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
