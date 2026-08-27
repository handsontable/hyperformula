import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MOD', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(101)'],
      ['=MOD(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(1, "foo")'],
      ['=MOD("bar", 4)'],
      ['=MOD("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return error when dividing by 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(42, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return error when dividing a negative dividend by 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(-42, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return error when dividing 0 by 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should propagate an error from the dividend', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(1/0, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(5, 2)'],
      ['=MOD(36, 6)'],
      ['=MOD(10.5, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1.5)
  })

  describe('with both arguments positive', () => {
    it('should return the remainder', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(7, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(1)
    })

    it('should return the dividend when it is smaller than the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(3, 12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(3)
    })
  })

  describe('with both arguments negative', () => {
    it('should return a negative remainder', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-7, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-1)
    })

    it('should return the dividend when its magnitude is smaller than the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-3, -12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-3)
    })
  })

  describe('with arguments of opposite signs', () => {
    it('should take the sign of the divisor for a negative dividend', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-3, 12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(9)
    })

    it('should take the sign of the divisor for a negative divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(5, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-1)
    })

    it('should take the sign of the divisor when the dividend is a multiple of the divisor plus a remainder', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-7, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(2)
    })

    it('should take the sign of the divisor when the magnitude of the dividend is smaller than the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-1, 12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(11)
    })

    it('should take the sign of the divisor when the dividend is smaller than the magnitude of the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(1, -12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-11)
    })
  })

  describe('when the dividend is an exact multiple of the divisor', () => {
    it('should return zero for two positive arguments', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(6, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should return zero for a negative dividend', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-6, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should return zero for a negative divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(6, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should return zero for two negative arguments', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-6, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })
  })

  describe('when the dividend is zero', () => {
    it('should return zero for a positive divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(0, 5)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should return zero for a negative divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(0, -5)']])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })
  })

  describe('with fractional arguments', () => {
    it('should return a positive remainder for two positive arguments', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(10.5, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(1.5)
    })

    it('should return a positive remainder for a negative dividend', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-10.5, 3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(1.5)
    })

    it('should return a negative remainder for a negative divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(10.5, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-1.5)
    })

    it('should return a negative remainder for two negative arguments', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-10.5, -3)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-1.5)
    })
  })

  describe('with a dividend of a large magnitude', () => {
    it('should not lose precision for a positive dividend', () => {
      const engine = HyperFormula.buildFromArray([[10000000000000000, 3, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(1)
    })

    it('should not lose precision for a negative dividend', () => {
      const engine = HyperFormula.buildFromArray([[-10000000000000000, 3, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(2)
    })

    it('should not lose precision for the largest positive dividend', () => {
      const engine = HyperFormula.buildFromArray([[1e308, 3, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(2)
    })

    it('should not lose precision for the largest negative dividend', () => {
      const engine = HyperFormula.buildFromArray([[-1e308, 3, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(1)
    })
  })

  describe('with a fractional divisor', () => {
    it('should not lose precision', () => {
      const engine = HyperFormula.buildFromArray([[-1.1, 0.1, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(0.1)
    })
  })

  describe('with a remainder negligible next to the divisor', () => {
    it('should return the remainder', () => {
      const engine = HyperFormula.buildFromArray([[1e-20, 3, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(1e-20)
    })
  })

  describe('when the divisor is close to the largest representable number', () => {
    it('should return the dividend', () => {
      const engine = HyperFormula.buildFromArray([[1e308, 1.7e308, '=MOD(A1, B1)']])

      expect(engine.getCellValue(adr('C1'))).toBe(1e308)
    })
  })

  describe('when the divisor overflows to infinity', () => {
    it('should return the dividend when both arguments are positive', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(10, "1e400")']])

      expect(engine.getCellValue(adr('A1'))).toBe(10)
    })

    it('should return an error when the arguments have opposite signs', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(-10, "1e400")']])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    })
  })

  describe('argument coercion', () => {
    it('should coerce strings and take the sign of the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD("-3", "12")']])

      expect(engine.getCellValue(adr('A1'))).toBe(9)
    })

    it('should coerce booleans and take the sign of the divisor', () => {
      const engine = HyperFormula.buildFromArray([['=MOD(TRUE(), -12)']])

      expect(engine.getCellValue(adr('A1'))).toBe(-11)
    })

    it('should coerce a reference to an empty cell to zero', () => {
      const engine = HyperFormula.buildFromArray([[null, '=MOD(A1, -5)']])

      expect(engine.getCellValue(adr('B1'))).toBe(0)
    })
  })
})
