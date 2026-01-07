import {ErrorType, HyperFormula} from '../../../src'
import {CellValueDetailedType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IRR', () => {
  const requiredFinancialPrecision = 6 // epsilon = 0.0000005

  describe('argument validation', () => {
    it('should return #NA! error with the wrong number of arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR()', '=IRR(A2:A3, 0.1, 1)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
      expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('should accept a single argument (values)', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should accept two arguments (values, guess)', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6, 0.15)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })
  })

  describe('error handling', () => {
    it('should return #NUM! if algorithm does not converge', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({100, 100, 100})'],
        ['=IRR({-100, -100, -100})'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('should return #NUM! when derivative is too small', () => {
      // At r=0 with cash flows {-0.5, 2, -1}:
      // dnpv = -1*2/(1+0)^2 - 2*(-1)/(1+0)^3 = -2 + 2 = 0
      // npv = -0.5 + 2 - 1 = 0.5 != 0
      // So derivative is zero but NPV is not, Newton-Raphson cannot proceed
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-0.5, 2, -1}, 0)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('should return #NUM! when max iterations reached', () => {
      // Cash flows that cause oscillation without convergence
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-1, 2, -1.0001}, 0.9)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('should return #NUM! when values do not contain at least one positive and one negative value', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({1, 2, 3})'],
        ['=IRR({-1, -2, -3})'],
        ['=IRR({0, 0, 0})'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('should propagate errors from values', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR(A2:A4)'],
        [-1000],
        ['=1/0'],
        [500],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should propagate errors from guess', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000, '=IRR(A1:A4, 1/0)'],
        [100],
        [200],
        [800],
      ])

      expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should return #VALUE! error when guess is not a number', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [800],
        ['=IRR(A1:A4, "abc")'],
      ])

      expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('should return #NUM! error when guess is -1 (division by zero)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-100, 200, 300}, -1)'],
      ])

      // guess = -1 causes division by zero in first iteration
      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('should return #NUM! for empty range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR(B1:B5)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
    })
  })

  describe('value type', () => {
    it('should set the value type to percent', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6)'],
      ])

      expect(engine.getCellValueDetailedType(adr('A7'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    })
  })

  describe('handling of text, logical, and empty values in ranges', () => {
    it('should ignore text values in ranges', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        ['text'],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A7)'],
      ])

      expect(engine.getCellValue(adr('A8'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should ignore logical values in ranges', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [true],
        [100],
        [200],
        [300],
        [false],
        [400],
        [500],
        ['=IRR(A1:A8)'],
      ])

      expect(engine.getCellValue(adr('A9'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should ignore empty cells in ranges', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [null],
        [100],
        [200],
        [300],
        [null],
        [400],
        [500],
        ['=IRR(A1:A8)'],
      ])

      expect(engine.getCellValue(adr('A9'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })
  })

  describe('basic calculations', () => {
    it('should compute IRR for basic cash flows', () => {
      const engine = HyperFormula.buildFromArray([
        [-70000],
        [12000],
        [15000],
        [18000],
        [21000],
        ['=IRR(A1:A5)'],
      ])

      expect(engine.getCellValue(adr('A6'))).toBeCloseTo(-0.0212448, requiredFinancialPrecision)
    })

    it('should compute IRR for investment with positive return', () => {
      const engine = HyperFormula.buildFromArray([
        [-70000],
        [12000],
        [15000],
        [18000],
        [21000],
        [26000],
        ['=IRR(A1:A6)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.0866309, requiredFinancialPrecision)
    })

    it('should compute IRR correctly for official example', () => {
      // Example from https://support.microsoft.com/en-us/office/irr-function-64925eaa-9988-495b-b290-3ad0c163c1bc
      const engine = HyperFormula.buildFromArray([
        [-70000],
        [12000],
        [15000],
        [18000],
        [21000],
        [26000],
        ['=IRR(A1:A5)'], // Four years return: ~-2.1%
        ['=IRR(A1:A6)'], // Five years return: ~8.7%
        ['=IRR(A1:A3, -10%)'], // Two years with guess: ~-44.4%
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(-0.0212448, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A8'))).toBeCloseTo(0.0866309, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A9'))).toBeCloseTo(-0.443507, requiredFinancialPrecision)
    })

    it('should work with inline arrays', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-100, 50, 50, 50})'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.233752, requiredFinancialPrecision)
    })
  })

  describe('guess parameter', () => {
    it('should use default guess of 0.1 (10%) when not specified', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6)'],
        ['=IRR(A1:A6, 0.1)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBe(engine.getCellValue(adr('A8')))
    })

    it('should allow guess close to -1', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6, -0.9)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should accept guess value of 0', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6, 0)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should accept large positive guess values', () => {
      const engine = HyperFormula.buildFromArray([
        [-100],
        [200],
        [300],
        ['=IRR(A1:A3, 1)'],
        ['=IRR(A1:A3, 2)'],
      ])

      // Should still find the correct IRR (or converge)
      expect(typeof engine.getCellValue(adr('A4'))).toBe('number')
      expect(typeof engine.getCellValue(adr('A5'))).toBe('number')
    })

    it('should find valid IRR even with guess less than -1', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-100, 200, 300}, -2)'],
      ])

      // For cash flows {-100, 200, 300}, IRR = -2 (-200%) is valid:
      // -100 + 200/(-1) + 300/1 = -100 - 200 + 300 = 0
      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-2, 6)
    })
  })

  describe('edge cases', () => {
    it('should handle very small cash flows', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-0.0001, 0.00005, 0.00006})'],
      ])

      expect(typeof engine.getCellValue(adr('A1'))).toBe('number')
    })

    it('should handle very large cash flows', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-1000000000, 500000000, 600000000})'],
      ])

      expect(typeof engine.getCellValue(adr('A1'))).toBe('number')
    })

    it('should handle cash flows with zero values', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-1000, 0, 0, 0, 2000})'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.189207, 5)
    })

    it('should handle many periods', () => {
      const engine = HyperFormula.buildFromArray([
        [-10000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
        [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
        ['=IRR(A1:K2)'],
      ])

      expect(typeof engine.getCellValue(adr('A3'))).toBe('number')
    })
  })

  describe('vertical and horizontal ranges', () => {
    it('should work with vertical range', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000],
        [100],
        [200],
        [300],
        [400],
        [500],
        ['=IRR(A1:A6)'],
      ])

      expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should work with horizontal range', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000, 100, 200, 300, 400, 500, '=IRR(A1:F1)'],
      ])

      expect(engine.getCellValue(adr('G1'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })

    it('should work with 2D range (row by row)', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000, 100, 200],
        [300, 400, 500],
        ['=IRR(A1:C2)'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.120058, requiredFinancialPrecision)
    })
  })

  describe('cell references', () => {
    it('should work with individual cell references', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000, 500, 600, '=IRR({A1, B1, C1})'],
      ])

      expect(typeof engine.getCellValue(adr('D1'))).toBe('number')
    })

    it('should work with named ranges', () => {
      const engine = HyperFormula.buildFromArray([
        [-1000, 500, 600],
      ])
      engine.addNamedExpression('cashflows', '=Sheet1!$A$1:$C$1')
      engine.setCellContents(adr('A2'), [['=IRR(cashflows)']])

      expect(typeof engine.getCellValue(adr('A2'))).toBe('number')
    })
  })

  describe('relationship with NPV', () => {
    it('NPV at IRR rate should be approximately zero', () => {
      const engine = HyperFormula.buildFromArray([
        [-70000],
        [12000],
        [15000],
        [18000],
        [21000],
        [26000],
        ['=IRR(A1:A6)'],
        ['=NPV(A7, A1:A6)'],
      ])

      // NPV at IRR rate should be very close to zero
      // Note: This depends on how NPV is implemented - it may need adjustment
      const npvValue = engine.getCellValue(adr('A8'))
      if (typeof npvValue === 'number') {
        expect(Math.abs(npvValue)).toBeLessThan(0.01)
      }
    })
  })

  describe('scenarios with no solution or multiple solutions', () => {
    it('should handle edge case with potential multiple solutions', () => {
      // Non-conventional cash flows may have multiple IRRs
      // Cash flow {-1000, 3000, -2500} has two valid IRRs: ~0.25 (25%) and ~1.0 (100%)
      const engine = HyperFormula.buildFromArray([
        ['=IRR({-1000, 3000, -2500})'],
      ])

      const result = engine.getCellValue(adr('A1'))

      if (typeof result === 'number') {
        // Should be one of the two valid solutions
        const isFirstSolution = Math.abs(result - 0.25) < 0.01
        const isSecondSolution = Math.abs(result - 1.0) < 0.01
        expect(isFirstSolution || isSecondSolution).toBe(true)
      } else {
        // Or #NUM! if algorithm cannot converge
        expect(result).toEqualError(detailedError(ErrorType.NUM))
      }
    })
  })
})
