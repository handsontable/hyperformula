import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function N', () => {
  describe('Argument validation', () => {
    it('should take exactly one argument', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N()'],
        ['=N(1, 2)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })
  })

  describe('Numeric values', () => {
    it('should return the number for numeric input', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(42)'],
        ['=N(-42)'],
        ['=N(3.14)'],
        ['=N(-3.14)'],
        ['=N(0)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(42)
      expect(engine.getCellValue(adr('A2'))).toBe(-42)
      expect(engine.getCellValue(adr('A3'))).toBe(3.14)
      expect(engine.getCellValue(adr('A4'))).toBe(-3.14)
      expect(engine.getCellValue(adr('A5'))).toBe(0)
    })

    it('should return number from cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', 123],
        ['=N(B2)', -456.78],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
      expect(engine.getCellValue(adr('A2'))).toBe(-456.78)
    })
  })

  describe('Logical values', () => {
    it('should return 1 for TRUE and 0 for FALSE', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(TRUE())'],
        ['=N(FALSE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(1)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
    })

    it('should return 1 for TRUE and 0 for FALSE from cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', '=TRUE()'],
        ['=N(B2)', '=FALSE()'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(1)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
    })
  })

  describe('Text values', () => {
    it('should return 0 for text strings', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N("Hello")'],
        ['=N("123")'],
        ['=N("")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
      expect(engine.getCellValue(adr('A3'))).toBe(0)
    })

    it('should return 0 for boolean values as text', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N("TRUE")'],
        ['=N("FALSE")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
    })

    it('should return 0 for text from cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', 'Hello'],
        ['=N(B2)', '\'123'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
    })
  })

  describe('Date values', () => {
    it('should return serial number for date', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(DATE(2011, 4, 17))'],
      ])

      // April 17, 2011 = serial number 40650 in 1900 date system
      expect(engine.getCellValue(adr('A1'))).toBe(40650)
    })

    it('should return serial number for date from cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', '=DATE(2011, 4, 17)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(40650)
    })
  })

  describe('Empty/Null values', () => {
    it('should return 0 for empty cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', null],
        ['=N(B2)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(0)
    })
  })

  describe('Error propagation', () => {
    it('should propagate error values', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(1/0)'],
        ['=N(NA())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    })

    it('should propagate error from cell reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(B1)', '=1/0'],
        ['=N(B2)', '=FOO()'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOO')))
    })
  })

  describe('Range values', () => {
    it('should use first cell value from range', () => {
      const engine = HyperFormula.buildFromArray([
        [42],
        ['text'],
        [100],
        ['=N(A1:A3)'],
      ])

      expect(engine.getCellValue(adr('A4'))).toBe(42)
    })

    it('should return 0 when first cell of range is text', () => {
      const engine = HyperFormula.buildFromArray([
        ['text'],
        [42],
        [100],
        ['=N(A1:A3)'],
      ])

      expect(engine.getCellValue(adr('A4'))).toBe(0)
    })

    it('should propagate error from first cell of range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=1/0'],
        [42],
        [100],
        ['=N(A1:A3)'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should return 0 when first cell of range is empty', () => {
      const engine = HyperFormula.buildFromArray([
        [null],
        [42],
        [100],
        ['=N(A1:A3)'],
      ])

      expect(engine.getCellValue(adr('A4'))).toBe(0)
    })

    it('should return 1 when first cell of range is TRUE', () => {
      const engine = HyperFormula.buildFromArray([
        ['=TRUE()'],
        [42],
        [100],
        ['=N(A1:A3)'],
      ])

      expect(engine.getCellValue(adr('A4'))).toBe(1)
    })
  })

  describe('Nested function calls', () => {
    it('should handle nested N calls', () => {
      const engine = HyperFormula.buildFromArray([
        ['=N(N("text"))'],
        ['=N(N(42))'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(42)
    })
  })
})
