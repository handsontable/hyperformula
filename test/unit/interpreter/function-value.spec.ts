import {CellValueDetailedType, ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function VALUE', () => {
  describe('argument validation', () => {
    it('should return error for wrong number of arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE()'],
        ['=VALUE("1", "2")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })
  })

  describe('basic numeric string conversion', () => {
    it('should convert integer string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should convert decimal string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123.45")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123.45)
    })

    it('should convert negative number string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("-123")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(-123)
    })

    it('should convert string with plus sign', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("+123")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should trim leading and trailing spaces', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("  123  ")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should convert string with leading zeros', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("00123")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should convert scientific notation (uppercase E)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("1.23E3")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(1230)
    })

    it('should convert scientific notation (lowercase e, negative exponent)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("1.5e-2")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0.015)
    })

    it('should convert string with thousand separator', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("1,234")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(1234)
    })

    it('should convert parentheses notation as negative number', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("(123)")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(-123)
    })
  })

  describe('percentage strings', () => {
    it('should convert percentage string to decimal', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("50%")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0.5)
    })
  })

  describe('currency strings', () => {
    it('should convert currency string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("$123")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should convert currency string with thousand separator and decimal', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("$1,234.56")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(1234.56)
    })
  })

  describe('date strings', () => {
    it('should convert date string to serial number', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("01/13/2026")'],
      ], {dateFormats: ['MM/DD/YYYY']})

      expect(engine.getCellValue(adr('A1'))).toBe(46035)
    })
  })

  describe('time strings', () => {
    it('should convert time string to fraction of day', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("14:30")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.60416667, 6)
    })

    it('should convert time string with seconds', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("12:30:45")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.52135417, 6)
    })

    it('should handle time greater than 24 hours', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("25:00")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.04166667, 6)
    })
  })

  describe('datetime strings', () => {
    it('should convert datetime string to serial number with time fraction', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("01/13/2026 14:30")'],
      ], {dateFormats: ['MM/DD/YYYY']})

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(46035.60417, 4)
    })
  })

  describe('error cases', () => {
    it('should return VALUE error for empty string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should return VALUE error for non-numeric string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("abc")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should return VALUE error for string with trailing text', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123abc")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should return VALUE error for European decimal format in default locale', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123,45")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should return VALUE error for 12-hour time format without proper config', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("3:00pm")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })
  })

  describe('type coercion', () => {
    it('should return VALUE error for boolean input', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE(TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should pass through number input unchanged', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE(123)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should propagate errors', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE(1/0)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should convert cell reference with numeric string', () => {
      const engine = HyperFormula.buildFromArray([
        ['123', '=VALUE(A1)'],
      ])

      expect(engine.getCellValue(adr('B1'))).toBe(123)
    })
  })

  describe('locale-specific behavior', () => {
    it('should respect decimal separator config', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123,45")'],
      ], {decimalSeparator: ',', thousandSeparator: ' '})

      expect(engine.getCellValue(adr('A1'))).toBe(123.45)
    })

    it('should respect thousand separator config', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("1 234,56")'],
      ], {decimalSeparator: ',', thousandSeparator: ' '})

      expect(engine.getCellValue(adr('A1'))).toBe(1234.56)
    })

    it('should respect custom currency symbol', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("€123")'],
      ], {currencySymbol: ['€']})

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })

    it('should handle currency symbol at end', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123€")'],
      ], {currencySymbol: ['€']})

      expect(engine.getCellValue(adr('A1'))).toBe(123)
    })
  })

  describe('custom parseDateTime', () => {
    it('should use custom parseDateTime function for date parsing', () => {
      const customParseDateTime = jasmine.createSpy().and.callFake((dateString: string) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString)
        if (match) {
          return {
            year: parseInt(match[1], 10),
            month: parseInt(match[2], 10),
            day: parseInt(match[3], 10),
          }
        }
        return undefined
      })

      const engine = HyperFormula.buildFromArray([
        ['=VALUE("2026-01-13")'],
      ], {
        parseDateTime: customParseDateTime,
        dateFormats: ['YYYY-MM-DD'],
      })

      expect(customParseDateTime).toHaveBeenCalled()
      expect(engine.getCellValue(adr('A1'))).toBe(46035)
    })

    it('should use custom parseDateTime function for time parsing', () => {
      const customParseDateTime = jasmine.createSpy().and.callFake((dateString: string) => {
        const match = /^(\d{1,2})h(\d{2})m$/.exec(dateString)
        if (match) {
          return {
            hours: parseInt(match[1], 10),
            minutes: parseInt(match[2], 10),
            seconds: 0,
          }
        }
        return undefined
      })

      const engine = HyperFormula.buildFromArray([
        ['=VALUE("14h30m")'],
      ], {
        parseDateTime: customParseDateTime,
        timeFormats: ['hh:mm'],
      })

      expect(customParseDateTime).toHaveBeenCalled()
      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.60416667, 6)
    })

    it('should use custom parseDateTime function for datetime parsing', () => {
      const customParseDateTime = jasmine.createSpy().and.callFake((dateString: string) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(dateString)
        if (match) {
          return {
            year: parseInt(match[1], 10),
            month: parseInt(match[2], 10),
            day: parseInt(match[3], 10),
            hours: parseInt(match[4], 10),
            minutes: parseInt(match[5], 10),
            seconds: 0,
          }
        }
        return undefined
      })

      const engine = HyperFormula.buildFromArray([
        ['=VALUE("2026-01-13T14:30")'],
      ], {
        parseDateTime: customParseDateTime,
        dateFormats: ['YYYY-MM-DD'],
        timeFormats: ['hh:mm'],
      })

      expect(customParseDateTime).toHaveBeenCalled()
      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(46035.60417, 4)
    })

    it('should return VALUE error when custom parseDateTime returns undefined', () => {
      const customParseDateTime = jasmine.createSpy().and.returnValue(undefined)

      const engine = HyperFormula.buildFromArray([
        ['=VALUE("invalid-format")'],
      ], {
        parseDateTime: customParseDateTime,
      })

      expect(customParseDateTime).toHaveBeenCalled()
      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })
  })

  describe('return type', () => {
    it('should return NUMBER_RAW for numeric string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("123")'],
      ])

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_RAW)
    })

    it('should return NUMBER_DATE for date string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("01/13/2026")'],
      ], {dateFormats: ['MM/DD/YYYY']})

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATE)
    })

    it('should return NUMBER_TIME for time string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("14:30")'],
      ])

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_TIME)
    })

    it('should return NUMBER_DATETIME for datetime string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("01/13/2026 14:30")'],
      ], {dateFormats: ['MM/DD/YYYY']})

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    })

    it('should return NUMBER_PERCENT for percentage string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("50%")'],
      ])

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    })

    it('should return NUMBER_CURRENCY for currency string', () => {
      const engine = HyperFormula.buildFromArray([
        ['=VALUE("$123")'],
      ])

      expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    })
  })
})
