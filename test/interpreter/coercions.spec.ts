import {HyperFormula} from '../../src'
import {CellError, EmptyValue, ErrorType} from '../../src/Cell'
import {Config} from '../../src/Config'
import {DateHelper} from '../../src/DateHelper'
import {
  coerceBooleanToNumber,
  coerceNonDateScalarToMaybeNumber,
  coerceScalarToBoolean,
  coerceScalarToNumberOrError,
  coerceScalarToString
} from '../../src/interpreter/coerce'
import '../testConfig'
import {adr, detailedError} from '../testUtils'
import {NumberLiteralsHelper} from '../../src/NumberLiteralsHelper'

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
  })
})

describe('#coerceBooleanToNumber', () => {
  it('works', () => {
    expect(coerceBooleanToNumber(true)).toBe(1)
    expect(coerceBooleanToNumber(false)).toBe(0)
  })

  it('behaves the same as more general coercion', () => {
    const config = new Config()
    const dateHelper = new DateHelper(config)
    const numberLiteralsHelper = new NumberLiteralsHelper(config)
    expect(coerceBooleanToNumber(true)).toBe(coerceScalarToNumberOrError(true, dateHelper, numberLiteralsHelper))
    expect(coerceBooleanToNumber(false)).toBe(coerceScalarToNumberOrError(false, dateHelper, numberLiteralsHelper))
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

describe('#coerceScalarToNumberOrError', () => {
  it('works', () => {
    const config = new Config()
    const dateHelper = new DateHelper(config)
    const numberLiteralsHelper = new NumberLiteralsHelper(config)
    expect(coerceScalarToNumberOrError(1, dateHelper, numberLiteralsHelper)).toEqual(1)

    expect(coerceScalarToNumberOrError(new CellError(ErrorType.DIV_BY_ZERO), dateHelper, numberLiteralsHelper)).toEqual(new CellError(ErrorType.DIV_BY_ZERO))

    expect(coerceScalarToNumberOrError('12/31/1899', dateHelper, numberLiteralsHelper)).toEqual(1)
    expect(coerceScalarToNumberOrError(true, dateHelper, numberLiteralsHelper)).toEqual(1)

    expect(coerceScalarToNumberOrError('foo42', dateHelper, numberLiteralsHelper)).toEqual(new CellError(ErrorType.VALUE))

    expect(coerceScalarToNumberOrError('1', dateHelper, numberLiteralsHelper)).toEqual(1)
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

describe('check if type coercions are applied', () => {
  it('boolean to int, true vs null', () => {
    const engine = HyperFormula.buildFromArray([
      [true, null, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(1) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(1) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(1) // EXP
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // UNARY PLUS
    expect(engine.getCellValue(adr('I1'))).toEqual(-1) // UNARY MINUS
    expect(engine.getCellValue(adr('J1'))).toEqual(0.01) // PERCENTAGE
  })

  it('boolean to int, null vs true', () => {
    const engine = HyperFormula.buildFromArray([
      [null, true, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(1) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(-1) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(0) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(0) // EXP
    expect(engine.getCellValue(adr('H1'))).toEqual(EmptyValue) // UNARY PLUS
    expect(engine.getCellValue(adr('I1'))).toEqual(0) // UNARY MINUS
    expect(engine.getCellValue(adr('J1'))).toEqual(0) // PERCENTAGE
  })

  it('boolean to int, true vs true', () => {
    const engine = HyperFormula.buildFromArray([
      [true, true, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(2) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(0) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(1) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(1) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(1) // EXP
  })

  it('boolean to int, true vs false', () => {
    const engine = HyperFormula.buildFromArray([
      [true, false, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(1) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(1) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(1) // EXP
  })

  it('boolean to int, false vs true', () => {
    const engine = HyperFormula.buildFromArray([
      [false, true, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(1) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(-1) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(0) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(0) // EXP
  })

  it('boolean to int, false vs false', () => {
    const engine = HyperFormula.buildFromArray([
      [false, false, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(0) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(0) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(1) // EXP
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // UNARY PLUS
    expect(engine.getCellValue(adr('I1'))).toEqual(0) // UNARY MINUS
    expect(engine.getCellValue(adr('J1'))).toEqual(0) // PERCENTAGE
  })

  it('boolean to int, null vs false', () => {
    const engine = HyperFormula.buildFromArray([
      [null, false, '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(0) //ADD
    expect(engine.getCellValue(adr('D1'))).toEqual(0) //SUB
    expect(engine.getCellValue(adr('E1'))).toEqual(0) //MULT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('G1'))).toEqual(1) // EXP
  })
  it( 'order operations, \'\' vs null', () => {
    const engine = HyperFormula.buildFromArray([
      [ '', null, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })
  it( 'order operations, string vs boolean', () => {
    const engine = HyperFormula.buildFromArray([
      [ 'string', false, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(true)
    expect(engine.getCellValue(adr('E1'))).toEqual(false)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })
  it( 'order operations, null vs false', () => {
    const engine = HyperFormula.buildFromArray([
      [ null, false, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })
  it( 'order operations, null vs 1', () => {
    const engine = HyperFormula.buildFromArray([
      [ null, 1, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(true)
    expect(engine.getCellValue(adr('E1'))).toEqual(false)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })

  it( 'order operations, -1 vs null', () => {
    const engine = HyperFormula.buildFromArray([
      [ -1, null, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(true)
    expect(engine.getCellValue(adr('E1'))).toEqual(false)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })

  it( 'order operations, 0 vs null', () => {
    const engine = HyperFormula.buildFromArray([
      [ 0, null, '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
    expect(engine.getCellValue(adr('F1'))).toEqual(true)
  })
})
