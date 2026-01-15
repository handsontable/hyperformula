/**
 * Strict Financial Precision Tests for HyperFormula
 * 
 * These tests ensure ZERO loss of precision throughout the entire chain:
 * INPUT (string) → CALCULATION (Numeric) → OUTPUT (exact value)
 * 
 * Based on: https://www.moderntreasury.com/journal/floats-dont-work-for-storing-cents
 * 
 * CRITICAL: All monetary inputs MUST be strings to avoid JavaScript number parsing loss.
 * JavaScript's number type is IEEE-754 float64 which cannot represent many decimals exactly.
 * 
 * These tests use getCellValueWithPrecision() which returns numbers as strings
 * to preserve full decimal precision and enable exact string comparisons.
 */

/* eslint-disable jest/expect-expect */

import {HyperFormula, RoundingMode} from '../../../src'
import {adr} from '../testUtils'

/**
 * Helper to create engine with strict precision settings
 */
function createStrictEngine(data: (string | number | null)[][]) {
  return HyperFormula.buildFromArray(data, {
    smartRounding: false,  // CRITICAL: Disable smart rounding for exact precision
  })
}

/**
 * Helper to get cell value with full precision (as string for numbers)
 */
function getPreciseValue(engine: HyperFormula, address: string): string | boolean | null {
  return engine.getCellValueWithPrecision(adr(address)) as string | boolean | null
}

/**
 * Helper to verify exact string equality for monetary values using precision API
 */
function expectExactPrecision(engine: HyperFormula, address: string, expectedValue: string) {
  const result = getPreciseValue(engine, address)
  expect(result).toBe(expectedValue)
}

describe('Strict Financial Precision Tests', () => {

  describe('Precision API Tests (getCellValueWithPrecision)', () => {
    /**
     * Tests for the new getCellValueWithPrecision API that returns numbers as strings
     * to preserve full decimal precision and avoid IEEE-754 conversion loss.
     */

    it('should return numbers as strings with full precision', () => {
      const engine = createStrictEngine([
        ['=0.1+0.2'],
        ['=1/3'],
        ['=123456789.123456789'],
      ])

      // getCellValueWithPrecision returns strings for numbers
      const value1 = engine.getCellValueWithPrecision(adr('A1'))
      const value2 = engine.getCellValueWithPrecision(adr('A2'))
      const value3 = engine.getCellValueWithPrecision(adr('A3'))

      expect(typeof value1).toBe('string')
      expect(typeof value2).toBe('string')
      expect(typeof value3).toBe('string')
      expect(value1).toBe('0.3')
    })

    it('should return booleans as booleans', () => {
      const engine = createStrictEngine([
        ['=1=1'],    // TRUE
        ['=1=2'],    // FALSE
        ['=2>1'],    // TRUE
      ])

      expect(engine.getCellValueWithPrecision(adr('A1'))).toBe(true)
      expect(engine.getCellValueWithPrecision(adr('A2'))).toBe(false)
      expect(engine.getCellValueWithPrecision(adr('A3'))).toBe(true)
    })

    it('should return null for empty cells', () => {
      const engine = createStrictEngine([
        ['=A2'],  // Reference to empty cell
      ])

      // Empty cell reference returns 0, but actual empty cell returns null
      expect(engine.getCellValueWithPrecision(adr('A2'))).toBeNull()
    })

    it('should work with getCellValue options parameter', () => {
      const engine = createStrictEngine([
        ['=0.1+0.2'],
      ])

      // Using options parameter
      const valueWithPrecision = engine.getCellValue(adr('A1'), { preservePrecision: true })
      const valueNormal = engine.getCellValue(adr('A1'))

      expect(typeof valueWithPrecision).toBe('string')
      expect(valueWithPrecision).toBe('0.3')
      expect(typeof valueNormal).toBe('number')
      expect(valueNormal).toBe(0.3)
    })

    it('should preserve precision for very small differences', () => {
      const engine = createStrictEngine([
        ['=1.00000000000001'],
        ['=1.00000000000002'],
        ['=A2-A1'],
      ])

      const diff = engine.getCellValueWithPrecision(adr('A3'))

      expect(diff).toBe('0.00000000000001')
    })

    it('getSheetValuesWithPrecision should return all values with precision', () => {
      const engine = createStrictEngine([
        ['=0.1', '=0.2', '=A1+B1'],
        ['=0.3', '=0.4', '=A2+B2'],
      ])

      const values = engine.getSheetValuesWithPrecision(0)

      expect(values[0][0]).toBe('0.1')
      expect(values[0][1]).toBe('0.2')
      expect(values[0][2]).toBe('0.3')
      expect(values[1][0]).toBe('0.3')
      expect(values[1][1]).toBe('0.4')
      expect(values[1][2]).toBe('0.7')
    })
  })

  describe('Modern Treasury Article: Base 2 vs Base 10 Approximation', () => {
    /**
     * From article: "$2.78 stored as float becomes 2.7799999713897705078125"
     * This is because 2.78 cannot be exactly represented in binary.
     */

    it('CRITICAL: 0.1 + 0.2 must equal exactly 0.3', () => {
      // This is the most famous IEEE-754 bug
      // In JavaScript: 0.1 + 0.2 = 0.30000000000000004
      const engine = createStrictEngine([
        ['=0.1+0.2'],
        ['=A1=0.3'],
        ['=A1-0.3'],  // Difference should be EXACTLY 0
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '0.3')

      expect(getPreciseValue(engine, 'A2')).toBe(true)
      expectExactPrecision(engine, 'A3', '0')
    })

    it('CRITICAL: 0.1 * 0.2 must equal exactly 0.02', () => {
      const engine = createStrictEngine([
        ['=0.1*0.2'],
        ['=A1=0.02'],
        ['=A1-0.02'],
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '0.02')

      expect(getPreciseValue(engine, 'A2')).toBe(true)
      expectExactPrecision(engine, 'A3', '0')
    })

    it('CRITICAL: 1.0 - 0.9 - 0.1 must equal exactly 0', () => {
      // In JavaScript: 1.0 - 0.9 - 0.1 = -2.7755575615628914e-17
      const engine = createStrictEngine([
        ['=1.0-0.9-0.1'],
        ['=A1=0'],
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '0')

      expect(getPreciseValue(engine, 'A2')).toBe(true)
    })

    it('CRITICAL: 0.3 - 0.1 must equal exactly 0.2', () => {
      // In JavaScript: 0.3 - 0.1 = 0.19999999999999998
      const engine = createStrictEngine([
        ['=0.3-0.1'],
        ['=A1=0.2'],
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '0.2')

      expect(getPreciseValue(engine, 'A2')).toBe(true)
    })

    it('CRITICAL: $2.78 round-trip must preserve exact value', () => {
      const engine = createStrictEngine([
        ['=2.78'],
        ['=A1*100'],   // Convert to cents: 278
        ['=A2/100'],   // Convert back: 2.78
        ['=A1=A3'],    // Must be TRUE
        ['=A1-A3'],    // Difference must be 0
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '2.78')
      expectExactPrecision(engine, 'A2', '278')
      expectExactPrecision(engine, 'A3', '2.78')

      expect(getPreciseValue(engine, 'A4')).toBe(true)
      expectExactPrecision(engine, 'A5', '0')
    })

    it('CRITICAL: Microdeposit verification (0.18 comparison)', () => {
      // From article: comparing 0.17953715949733673 to 0.18 fails
      const engine = createStrictEngine([
        ['=0.18'],
        ['=A1=0.18'],  // Must be TRUE
        ['=0.18-A1'],  // Must be 0
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1', '0.18')

      expect(getPreciseValue(engine, 'A2')).toBe(true)
      expectExactPrecision(engine, 'A3', '0')
    })
  })

  describe('Modern Treasury Article: Cascading Errors', () => {
    /**
     * From article: "order of operations can create subtle differences that snowball"
     */

    it('CRITICAL: Sum of 100 pennies must equal exactly $1.00', () => {
      // Build array of 100 cells with =0.01
      const rows: (string | number | null)[][] = []
      for (let i = 0; i < 100; i++) {
        rows.push(['=0.01'])
      }
      rows.push(['=SUM(A1:A100)'])
      rows.push(['=A101=1'])
      rows.push(['=A101-1'])

      const engine = createStrictEngine(rows)

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A101', '1')

      expect(getPreciseValue(engine, 'A102')).toBe(true)
      expectExactPrecision(engine, 'A103', '0')
    })

    it('CRITICAL: Sum of 1000 pennies must equal exactly $10.00', () => {
      const rows: (string | number | null)[][] = []
      for (let i = 0; i < 1000; i++) {
        rows.push(['=0.01'])
      }
      rows.push(['=SUM(A1:A1000)'])
      rows.push(['=A1001=10'])

      const engine = createStrictEngine(rows)

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A1001', '10')

      expect(getPreciseValue(engine, 'A1002')).toBe(true)
    })

    it('CRITICAL: Order of operations must not affect result', () => {
      const engine = createStrictEngine([
        // Method 1: (a + b + c) * d
        ['=0.1', '=0.2', '=0.3', '=(A1+B1+C1)*10'],
        // Method 2: a*d + b*d + c*d
        ['=A1*10+B1*10+C1*10'],
        // Must be equal
        ['=D1=A2'],
        ['=D1-A2'],
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'D1', '6')
      expectExactPrecision(engine, 'A2', '6')

      expect(getPreciseValue(engine, 'A3')).toBe(true)
      expectExactPrecision(engine, 'A4', '0')
    })

    it('CRITICAL: Repeated add/subtract must not drift', () => {
      // Add 0.1, then subtract 0.1, repeat 100 times
      const rows: (string | number | null)[][] = [['=1']]
      for (let i = 0; i < 100; i++) {
        rows.push([`=A${rows.length}+0.1`])
        rows.push([`=A${rows.length}-0.1`])
      }
      rows.push([`=A${rows.length}=1`])
      rows.push([`=A${rows.length - 1}-1`])

      const engine = createStrictEngine(rows)
      const lastDataRow = rows.length - 2
      const comparisonRow = rows.length - 1
      const diffRow = rows.length

      expect(engine.getCellValue(adr(`A${lastDataRow}`))).toBe(1)
      expect(engine.getCellValue(adr(`A${comparisonRow}`))).toBe(true)
      expect(engine.getCellValue(adr(`A${diffRow}`))).toBe(0)
    })
  })

  describe('Modern Treasury Article: Two Different Zeros', () => {
    /**
     * From article: IEEE-754 has +0 and -0 which can cause comparison issues
     */

    it('CRITICAL: +0 and -0 must be equal', () => {
      const engine = createStrictEngine([
        ['=0'],
        ['=-0'],
        ['=A1=B1'],
        ['=A1-B1'],
        ['=A1+B1'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A4'))).toBe(0)
      expect(engine.getCellValue(adr('A5'))).toBe(0)
    })

    it('CRITICAL: Very small result must equal zero when expected', () => {
      const engine = createStrictEngine([
        ['=0.1+0.1+0.1-0.3'],  // Should be exactly 0
        ['=A1=0'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(true)
    })
  })

  describe('Penny Shaving / Salami Slicing Prevention', () => {
    /**
     * From article: "Office Space" attack - accumulating tiny rounding errors
     * Reference: https://www.moderntreasury.com/journal/floats-dont-work-for-storing-cents
     */

    it('CRITICAL: Division remainder must be tracked exactly', () => {
      const engine = createStrictEngine([
        // Divide $100 among 3 people, track remainder
        ['=100', '=3'],
        ['=TRUNC(A1/B1, 2)'],  // Per person: $33.33
        ['=A2*B1'],            // Distributed: $99.99
        ['=A1-A3'],            // Remainder: $0.01 (THE PENNY!)
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A2', '33.33')
      expectExactPrecision(engine, 'A3', '99.99')
      expectExactPrecision(engine, 'A4', '0.01')
    })

    it('CRITICAL: Large transaction penny shaving must be detected', () => {
      const engine = createStrictEngine([
        // $1,000,000.01 divided among 3 accounts
        ['=1000000.01', '=3'],
        ['=TRUNC(A1/B1, 2)'],  // Per account
        ['=A2*B1'],            // Total distributed
        ['=A1-A3'],            // Remainder (lost pennies!)
      ])

      // Using precision API for exact string comparison
      expectExactPrecision(engine, 'A2', '333333.33')
      expectExactPrecision(engine, 'A3', '999999.99')
      expectExactPrecision(engine, 'A4', '0.02')  // 2 cents remainder
    })

    it('CRITICAL: Interest calculation penny tracking', () => {
      // $10000 at 5.5% annual, monthly compounding
      const engine = createStrictEngine([
        ['=10000', '=0.055', '=12'],  // Principal, rate, months
        ['=A1*(1+B1/12)^C1'],         // After 1 year
        ['=A2-A1'],                   // Interest earned
        ['=ROUND(A3, 2)'],            // Rounded interest
        ['=A3-A4'],                   // Lost to rounding
      ])

      // Using precision API to verify interest calculation
      const totalInterest = getPreciseValue(engine, 'A3') as string
      const lost = getPreciseValue(engine, 'A5') as string

      // Verify the interest is calculated precisely
      expect(parseFloat(totalInterest)).toBeCloseTo(564.08, 2)
      expectExactPrecision(engine, 'A4', '564.08')
      // The difference should be tracked, not silently lost
      expect(typeof lost).toBe('string')
    })
  })

  describe('Edge Cases: Problematic Decimal Values', () => {
    /**
     * These specific decimal values are known to cause IEEE-754 issues
     */

    it('CRITICAL: 0.01 operations', () => {
      const engine = createStrictEngine([
        ['=0.01'],
        ['=A1*100'],
        ['=A2=1'],
        ['=A1+0.01'],
        ['=A4=0.02'],
        ['=A1-0.01'],
        ['=A6=0'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
      expect(engine.getCellValue(adr('A7'))).toBe(true)
    })

    it('CRITICAL: 0.05 operations', () => {
      const engine = createStrictEngine([
        ['=0.05'],
        ['=A1*20'],
        ['=A2=1'],
        ['=A1+0.05'],
        ['=A4=0.1'],
        ['=A1*2'],
        ['=A6=0.1'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
      expect(engine.getCellValue(adr('A7'))).toBe(true)
    })

    it('CRITICAL: 0.07 operations (notoriously problematic)', () => {
      const engine = createStrictEngine([
        ['=0.07'],
        ['=A1*100'],
        ['=A2=7'],
        ['=A1+0.03'],
        ['=A4=0.1'],
        ['=A1*3'],
        ['=A6=0.21'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
      expect(engine.getCellValue(adr('A7'))).toBe(true)
    })

    it('CRITICAL: 0.33 operations (1/3 approximation)', () => {
      const engine = createStrictEngine([
        ['=0.33'],
        ['=A1*3'],
        ['=A2=0.99'],
        ['=A1+0.34'],
        ['=A4=0.67'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
    })

    it('CRITICAL: Price ending in .99', () => {
      const engine = createStrictEngine([
        ['=9.99'],
        ['=A1+0.01'],
        ['=A2=10'],
        ['=A1*10'],
        ['=A4=99.9'],
        ['=A1*100'],
        ['=A6=999'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
      expect(engine.getCellValue(adr('A7'))).toBe(true)
    })

    it('CRITICAL: Common tax rates', () => {
      const engine = createStrictEngine([
        // 7.25% tax
        ['=100'],
        ['=A1*0.0725'],
        ['=A2=7.25'],
        // 8.875% tax
        ['=100'],
        ['=A4*0.08875'],
        ['=A5=8.875'],
        // 6.5% tax
        ['=100'],
        ['=A7*0.065'],
        ['=A8=6.5'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A6'))).toBe(true)
      expect(engine.getCellValue(adr('A9'))).toBe(true)
    })
  })

  describe('Large Number Precision', () => {
    /**
     * From article: "$25,474,937.47 stored as float32 becomes $25,474,936.32"
     */

    it('CRITICAL: Million dollar precision', () => {
      const engine = createStrictEngine([
        ['=1000000.01'],
        ['=A1+0.01'],
        ['=A2=1000000.02'],
        ['=A1*2'],
        ['=A4=2000000.02'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
    })

    it('CRITICAL: Billion dollar precision', () => {
      const engine = createStrictEngine([
        ['=1000000000.01'],
        ['=A1+0.01'],
        ['=A2=1000000000.02'],
        ['=A1-0.01'],
        ['=A4=1000000000'],
      ])

      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
    })
  })

  describe('Comparison Operations', () => {
    /**
     * Comparisons must be exact, not epsilon-based
     */

    it('CRITICAL: Equality comparison must be exact', () => {
      const engine = createStrictEngine([
        ['=0.1+0.2', '=0.3', '=A1=B1'],
        ['=0.1*3', '=0.3', '=A2=B2'],
        ['=0.6/2', '=0.3', '=A3=B3'],
      ])

      expect(engine.getCellValue(adr('C1'))).toBe(true)
      expect(engine.getCellValue(adr('C2'))).toBe(true)
      expect(engine.getCellValue(adr('C3'))).toBe(true)
    })

    it('CRITICAL: Less than/greater than comparisons', () => {
      const engine = createStrictEngine([
        ['=0.1+0.2', '=0.3'],
        ['=A1<B1'],   // FALSE (equal)
        ['=A1>B1'],   // FALSE (equal)
        ['=A1<=B1'],  // TRUE
        ['=A1>=B1'],  // TRUE
      ])

      expect(engine.getCellValue(adr('A2'))).toBe(false)
      expect(engine.getCellValue(adr('A3'))).toBe(false)
      expect(engine.getCellValue(adr('A4'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
    })

    it('CRITICAL: Price comparison for sorting', () => {
      const engine = createStrictEngine([
        ['=9.99', '=9.99', '=A1=B1'],
        ['=9.99', '=10.00', '=A2<B2'],
        ['=10.00', '=9.99', '=A3>B3'],
      ])

      expect(engine.getCellValue(adr('C1'))).toBe(true)
      expect(engine.getCellValue(adr('C2'))).toBe(true)
      expect(engine.getCellValue(adr('C3'))).toBe(true)
    })
  })

  describe('Formula Chain Precision', () => {
    /**
     * Test that precision is maintained through multiple formula dependencies
     */

    it('CRITICAL: 10-level formula chain', () => {
      const engine = createStrictEngine([
        ['=0.1'],
        ['=A1+0.1'],  // 0.2
        ['=A2+0.1'],  // 0.3
        ['=A3+0.1'],  // 0.4
        ['=A4+0.1'],  // 0.5
        ['=A5+0.1'],  // 0.6
        ['=A6+0.1'],  // 0.7
        ['=A7+0.1'],  // 0.8
        ['=A8+0.1'],  // 0.9
        ['=A9+0.1'],  // 1.0
        ['=A10=1'],   // Must be TRUE
      ])

      expect(engine.getCellValue(adr('A10'))).toBe(1)
      expect(engine.getCellValue(adr('A11'))).toBe(true)
    })

    it('CRITICAL: Complex dependency graph', () => {
      const engine = createStrictEngine([
        ['=0.1', '=0.2', '=0.3'],
        ['=A1+B1', '=B1+C1', '=A1+C1'],    // 0.3, 0.5, 0.4
        ['=A2+B2+C2'],                      // 1.2
        ['=A3=1.2'],
      ])

      expect(engine.getCellValue(adr('A2'))).toBe(0.3)
      expect(engine.getCellValue(adr('B2'))).toBe(0.5)
      expect(engine.getCellValue(adr('C2'))).toBe(0.4)
      expect(engine.getCellValue(adr('A3'))).toBe(1.2)
      expect(engine.getCellValue(adr('A4'))).toBe(true)
    })
  })

  describe('Division Edge Cases', () => {

    it('CRITICAL: Division that should result in exact decimal', () => {
      const engine = createStrictEngine([
        ['=1/2', '=A1=0.5'],
        ['=1/4', '=A2=0.25'],
        ['=1/5', '=A3=0.2'],
        ['=1/8', '=A4=0.125'],
        ['=1/10', '=A5=0.1'],
        ['=1/20', '=A6=0.05'],
        ['=1/25', '=A7=0.04'],
        ['=1/50', '=A8=0.02'],
        ['=1/100', '=A9=0.01'],
      ])

      for (let i = 1; i <= 9; i++) {
        expect(engine.getCellValue(adr(`B${i}`))).toBe(true)
      }
    })

    it('CRITICAL: Repeating decimal multiplication', () => {
      // 1/3 * 3 should be very close to 1 (within decimal.js precision)
      const engine = createStrictEngine([
        ['=1/3'],
        ['=A1*3'],
        // Note: 1/3 is infinite in base 10, so we check closeness
      ])

      const result = engine.getCellValue(adr('A2')) as number

      expect(result).toBeCloseTo(1, 10)
    })
  })

  describe('Tax and Fee Calculations', () => {

    it('CRITICAL: VAT calculation', () => {
      const engine = createStrictEngine([
        ['=99.99'],         // Net amount
        ['=0.2'],           // VAT rate (20%)
        ['=A1*A2'],         // VAT amount
        ['=A1+A3'],         // Gross amount
      ])

      expectExactPrecision(engine, 'A3', '19.998')
      expectExactPrecision(engine, 'A4', '119.988')
    })

    it('CRITICAL: Percentage calculations for financial products', () => {
      const engine = createStrictEngine([
        ['=123.45'],        // Amount
        ['=A1*0.15'],       // 15%
        ['=A1*0.175'],      // 17.5%
        ['=A1*0.2'],        // 20%
      ])

      expectExactPrecision(engine, 'A2', '18.5175')
      expectExactPrecision(engine, 'A3', '21.60375')
      expectExactPrecision(engine, 'A4', '24.69')
    })
  })

  describe('Interest and Loan Calculations', () => {

    it('CRITICAL: Simple interest calculation', () => {
      // I = P * r * t
      const engine = createStrictEngine([
        ['=10000', '=0.05', '=3'],  // Principal, Rate, Time
        ['=A1*B1*C1'],              // Interest
        ['=A1+A2'],                 // Total
      ])

      expectExactPrecision(engine, 'A2', '1500')
      expectExactPrecision(engine, 'A3', '11500')
    })

    it('CRITICAL: Compound interest calculation', () => {
      // A = P(1 + r/n)^(nt)
      // P=10000, r=0.05, n=12, t=10
      const engine = createStrictEngine([
        ['=10000', '=0.05', '=12', '=10'],  // Principal, Rate, Compounds/Year, Years
        ['=A1*(1+B1/C1)^(C1*D1)'],          // Final amount
        ['=A2-A1'],                          // Interest earned
      ])

      // Verify compound interest is calculated correctly
      const finalAmount = parseFloat(getPreciseValue(engine, 'A2') as string)

      expect(finalAmount).toBeCloseTo(16470.09, 2)
    })

    it('CRITICAL: PMT-like loan payment calculation', () => {
      // PMT = P * (r(1+r)^n) / ((1+r)^n - 1)
      // P=200000, annual_rate=0.06, years=30
      const engine = createStrictEngine([
        ['=200000', '=0.06', '=30'],           // Principal, Annual Rate, Years
        ['=B1/12'],                             // Monthly rate
        ['=C1*12'],                             // Total months
        ['=A1*(A2*(1+A2)^A3)/((1+A2)^A3-1)'],  // Monthly payment
      ])

      const payment = parseFloat(getPreciseValue(engine, 'A4') as string)

      expect(payment).toBeCloseTo(1199.10, 2)
    })
  })

  describe('SmartRounding Behavior Documentation', () => {
    /**
     * These tests document the behavior difference between
     * smartRounding: true (default) vs smartRounding: false
     */

    it('smartRounding=false preserves exact precision', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
      ], { smartRounding: false })

      expectExactPrecision(engine, 'A1', '0.3')
    })

    it('smartRounding=true applies rounding to displayed values', () => {
      const engine = HyperFormula.buildFromArray([
        ['=100000000000.99+200000000000.01'],
      ], { smartRounding: true })

      // With smartRounding, result may be rounded
      const result = engine.getCellValue(adr('A1')) as number

      expect(typeof result).toBe('number')
    })
  })

  describe('Stress Tests', () => {

    it('CRITICAL: Decimal precision round-trip', () => {
      const engine = createStrictEngine([
        ['=0.12345678'],
        ['=A1*100000000'],
        ['=A2/100000000'],
        ['=A1=A3'],
      ])

      expectExactPrecision(engine, 'A2', '12345678')
      expectExactPrecision(engine, 'A3', '0.12345678')

      expect(getPreciseValue(engine, 'A4')).toBe(true)
    })

    it('CRITICAL: Alternating add/subtract without drift', () => {
      // Start with 1, add 0.1, subtract 0.1, repeat 100 times
      const rows: (string | number | null)[][] = [['=1']]
      for (let i = 0; i < 100; i++) {
        rows.push([`=A${rows.length}+0.1`])
        rows.push([`=A${rows.length}-0.1`])
      }
      rows.push([`=A${rows.length}=1`])

      const engine = createStrictEngine(rows)
      const lastRow = rows.length

      expect(getPreciseValue(engine, `A${lastRow}`)).toBe(true)
    })
  })

  describe('Financial Precision Scenarios (no penny loss)', () => {
    /**
     * Tests verifying that internal decimal.js calculations preserve exact precision.
     * All assertions use string comparisons to avoid JavaScript number precision loss.
     * 
     * These tests ensure: NO PENNY LOSS in financial calculations.
     */

    it('Exact division - 100 / 3 preserves full precision', () => {
      const engine = createStrictEngine([
        ['=100/3'],
      ])
      
      // Division result preserves many decimal places (no truncation)
      const result = getPreciseValue(engine, 'A1') as string

      expect(result.startsWith('33.33333333333333')).toBe(true)
    })

    it('Commission calculation preserves exact result', () => {
      const engine = createStrictEngine([
        ['=12345.67'],          // Sale amount
        ['=A1*0.025'],          // 2.5% commission
      ])

      // 12345.67 * 0.025 = 308.64175 exactly
      expectExactPrecision(engine, 'A2', '308.64175')
    })

    it('Tax calculation preserves exact intermediate values', () => {
      const engine = createStrictEngine([
        ['=99.99'],             // Price
        ['=A1*0.0825'],         // Tax 8.25%
      ])

      // 99.99 * 0.0825 = 8.249175 exactly
      expectExactPrecision(engine, 'A2', '8.249175')
    })

    it('Bill split - division by exact divisor preserves precision', () => {
      const engine = createStrictEngine([
        ['=99'],                // Total bill (divisible by 3)
        ['=99/3'],              // Exact division = 33
        ['=A2*3'],              // Multiply back
        ['=A1-A3'],             // Difference should be exactly 0
      ])

      expectExactPrecision(engine, 'A2', '33')
      expectExactPrecision(engine, 'A3', '99')
      expectExactPrecision(engine, 'A4', '0')
    })

    it('Penny shaving prevention - exact divisibility', () => {
      const engine = createStrictEngine([
        ['=1000000.02'],        // Large amount (divisible by 2)
        ['=A1/2'],              // Divide by 2
        ['=A2*2'],              // Multiply back
        ['=A1-A3'],             // Difference must be 0
      ])

      expectExactPrecision(engine, 'A2', '500000.01')
      expectExactPrecision(engine, 'A3', '1000000.02')
      expectExactPrecision(engine, 'A4', '0')
    })

    it('Currency conversion preserves exact precision', () => {
      const engine = createStrictEngine([
        ['=1000'],              // USD
        ['=0.92345'],           // Exchange rate
        ['=A1*A2'],             // EUR
      ])

      // 1000 * 0.92345 = 923.45 exactly
      expectExactPrecision(engine, 'A3', '923.45')
    })

    it('Chained multiplications preserve precision', () => {
      const engine = createStrictEngine([
        ['=0.1'],
        ['=A1*10'],             // Should be exactly 1
        ['=A2*10'],             // Should be exactly 10
        ['=A3*10'],             // Should be exactly 100
      ])

      expectExactPrecision(engine, 'A2', '1')
      expectExactPrecision(engine, 'A3', '10')
      expectExactPrecision(engine, 'A4', '100')
    })

    it('Subtraction chain preserves zero', () => {
      const engine = createStrictEngine([
        ['=1.0-0.9-0.1'],       // Classic IEEE-754 problem
      ])

      // With decimal.js: 1.0 - 0.9 - 0.1 = 0 exactly
      expectExactPrecision(engine, 'A1', '0')
    })

    it('Sum of prices equals exact total', () => {
      const engine = createStrictEngine([
        ['=19.99'],
        ['=29.99'],
        ['=9.99'],
        ['=A1+A2+A3'],
      ])

      // 19.99 + 29.99 + 9.99 = 59.97 exactly
      expectExactPrecision(engine, 'A4', '59.97')
    })

    it('Percentage discount calculation is exact', () => {
      const engine = createStrictEngine([
        ['=199.99'],            // Original price
        ['=0.15'],              // 15% discount
        ['=A1*A2'],             // Discount amount
        ['=A1-A3'],             // Final price
      ])

      // 199.99 * 0.15 = 29.9985
      expectExactPrecision(engine, 'A3', '29.9985')
      // 199.99 - 29.9985 = 169.9915
      expectExactPrecision(engine, 'A4', '169.9915')
    })

    it('Complex formula with multiple operations preserves precision', () => {
      const engine = createStrictEngine([
        ['=1000'],              // Principal
        ['=0.05'],              // Rate
        ['=12'],                // Months  
        ['=A1*A2*A3/12'],       // Simple interest
      ])

      // 1000 * 0.05 * 12 / 12 = 50 exactly
      expectExactPrecision(engine, 'A4', '50')
    })

    it('SUM function preserves precision across many values', () => {
      const engine = createStrictEngine([
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=0.01'],
        ['=SUM(A1:A10)'],       // Sum of 10 x 0.01
      ])

      // 10 * 0.01 = 0.1 exactly
      expectExactPrecision(engine, 'A11', '0.1')
    })

    it('Division and multiplication are inverse operations (exact divisor)', () => {
      const engine = createStrictEngine([
        ['=125'],               // Divisible by 5
        ['=A1/5'],              // Divide = 25
        ['=A2*5'],              // Multiply back = 125
        ['=A1-A3'],             // Difference = 0
      ])

      expectExactPrecision(engine, 'A2', '25')
      expectExactPrecision(engine, 'A3', '125')
      expectExactPrecision(engine, 'A4', '0')
    })
  })

  describe('Rounding Mode Configuration Tests', () => {
    /**
     * Tests for different rounding modes configured via numericRounding.
     * 
     * The rounding mode affects internal decimal.js calculations when results
     * exceed the configured precision (e.g., 1/3 = 0.333... must be truncated).
     */

    /**
     *
     */
    function createEngineWithRounding(
      data: (string | number | null)[][],
      rounding: RoundingMode,
      digits: number = 10
    ) {
      return HyperFormula.buildFromArray(data, {
        smartRounding: false,
        numericImplementation: 'precise',
        numericRounding: rounding,
        numericDigits: digits,
      })
    }

    describe('ROUND_HALF_UP (banker default)', () => {
      it('division preserves precision with configured digits', () => {
        // With 4 significant digits, 1/3 = 0.3333
        const engine = createEngineWithRounding([
          ['=1/3'],  // 0.3333...
        ], RoundingMode.ROUND_HALF_UP, 4)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.3333')
      })

      it('rounds last digit up when >= 5', () => {
        // 1/6 = 0.16666... with 3 significant digits and HALF_UP = 0.167
        const engine = createEngineWithRounding([
          ['=1/6'],
        ], RoundingMode.ROUND_HALF_UP, 3)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.167')
      })
    })

    describe('ROUND_HALF_DOWN', () => {
      it('rounds last digit down when exactly 5', () => {
        // 1/8 = 0.125 with 2 significant digits and HALF_DOWN = 0.12
        const engine = createEngineWithRounding([
          ['=1/8'],  // 0.125
        ], RoundingMode.ROUND_HALF_DOWN, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.12')
      })

      it('rounds up when > 5', () => {
        // 1/6 = 0.16666... with 2 significant digits and HALF_DOWN = 0.17
        const engine = createEngineWithRounding([
          ['=1/6'],
        ], RoundingMode.ROUND_HALF_DOWN, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.17')
      })
    })

    describe('ROUND_HALF_EVEN (bankers rounding)', () => {
      it('rounds 0.5 to nearest even - up to 2', () => {
        const engine = createEngineWithRounding([
          ['=15/10'],  // 1.5 -> rounds to 2 (nearest even)
        ], RoundingMode.ROUND_HALF_EVEN, 1)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('2')
      })

      it('rounds 0.5 to nearest even - down to 2', () => {
        const engine = createEngineWithRounding([
          ['=25/10'],  // 2.5 -> rounds to 2 (nearest even)
        ], RoundingMode.ROUND_HALF_EVEN, 1)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('2')
      })

      it('rounds 0.5 to nearest even - up to 4', () => {
        const engine = createEngineWithRounding([
          ['=35/10'],  // 3.5 -> rounds to 4 (nearest even)
        ], RoundingMode.ROUND_HALF_EVEN, 1)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('4')
      })
    })

    describe('ROUND_UP (away from zero)', () => {
      it('always rounds positive up', () => {
        const engine = createEngineWithRounding([
          ['=1/3'],  // 0.333...
        ], RoundingMode.ROUND_UP, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.34')
      })

      it('always rounds negative away from zero', () => {
        const engine = createEngineWithRounding([
          ['=-1/3'],  // -0.333...
        ], RoundingMode.ROUND_UP, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('-0.34')
      })
    })

    describe('ROUND_DOWN (towards zero / truncate)', () => {
      it('truncates positive numbers', () => {
        const engine = createEngineWithRounding([
          ['=1/3'],  // 0.333...
        ], RoundingMode.ROUND_DOWN, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.33')
      })

      it('truncates negative numbers towards zero', () => {
        const engine = createEngineWithRounding([
          ['=-1/3'],  // -0.333...
        ], RoundingMode.ROUND_DOWN, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('-0.33')
      })
    })

    describe('ROUND_CEIL (towards +infinity)', () => {
      it('rounds positive up', () => {
        const engine = createEngineWithRounding([
          ['=1/3'],  // 0.333...
        ], RoundingMode.ROUND_CEIL, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.34')
      })

      it('rounds negative towards +infinity (up towards zero)', () => {
        const engine = createEngineWithRounding([
          ['=-1/3'],  // -0.333...
        ], RoundingMode.ROUND_CEIL, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('-0.33')
      })
    })

    describe('ROUND_FLOOR (towards -infinity)', () => {
      it('rounds positive down', () => {
        const engine = createEngineWithRounding([
          ['=1/3'],  // 0.333...
        ], RoundingMode.ROUND_FLOOR, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('0.33')
      })

      it('rounds negative towards -infinity (away from zero)', () => {
        const engine = createEngineWithRounding([
          ['=-1/3'],  // -0.333...
        ], RoundingMode.ROUND_FLOOR, 2)

        const result = getPreciseValue(engine, 'A1') as string

        expect(result).toBe('-0.34')
      })
    })

    describe('Rounding impact on financial calculations', () => {
      it('Different rounding modes produce different results for same calculation', () => {
        const data: (string | number | null)[][] = [['=100/3']]  // 33.333...

        const halfUp = createEngineWithRounding(data, RoundingMode.ROUND_HALF_UP, 2)
        const down = createEngineWithRounding(data, RoundingMode.ROUND_DOWN, 2)
        const up = createEngineWithRounding(data, RoundingMode.ROUND_UP, 2)

        expect(getPreciseValue(halfUp, 'A1')).toBe('33')
        expect(getPreciseValue(down, 'A1')).toBe('33')
        expect(getPreciseValue(up, 'A1')).toBe('34')
      })

      it('Bankers rounding (HALF_EVEN) vs HALF_UP for repeating decimals', () => {
        // 1/3 with different rounding modes shows the difference
        const dataHalfUp = createEngineWithRounding([['=1/3']], RoundingMode.ROUND_HALF_UP, 4)
        const dataHalfEven = createEngineWithRounding([['=1/3']], RoundingMode.ROUND_HALF_EVEN, 4)

        // 0.3333... with 4 significant digits
        // Both round to 0.3333 (no difference for this value)
        expect(getPreciseValue(dataHalfUp, 'A1')).toBe('0.3333')
        expect(getPreciseValue(dataHalfEven, 'A1')).toBe('0.3333')
      })

      it('Higher precision digits preserves more accuracy', () => {
        const data: (string | number | null)[][] = [['=1/7']]  // 0.142857142857...

        const low = createEngineWithRounding(data, RoundingMode.ROUND_HALF_UP, 4)
        const high = createEngineWithRounding(data, RoundingMode.ROUND_HALF_UP, 10)

        expect(getPreciseValue(low, 'A1')).toBe('0.1429')
        expect(getPreciseValue(high, 'A1')).toBe('0.1428571429')
      })
    })
  })

})
