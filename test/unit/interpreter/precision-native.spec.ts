/**
 * Native Number Implementation Tests (IEEE-754)
 * 
 * These tests demonstrate the behavior differences when using native JavaScript numbers.
 * They show the precision limitations of IEEE-754 float64.
 * 
 * The native implementation is useful for:
 * - Backward compatibility
 * - Performance-critical non-financial calculations
 * - Cases where approximate results are acceptable
 */

import {HyperFormula} from '../../../src'
import {adr} from '../testUtils'

/**
 * Helper to create engine with native (IEEE-754) number implementation
 */
function createNativeEngine(data: (string | number | null)[][]) {
  return HyperFormula.buildFromArray(data, {
    smartRounding: false,
    numericImplementation: 'native',
  })
}

/**
 * Helper to create engine with precise (decimal.js) implementation for comparison
 */
function createPreciseEngine(data: (string | number | null)[][]) {
  return HyperFormula.buildFromArray(data, {
    smartRounding: false,
    numericImplementation: 'precise',
  })
}

describe('Native Number Implementation Tests (IEEE-754)', () => {

  describe('IEEE-754 Precision Issues', () => {

    it('DEMO: 0.1 + 0.2 !== 0.3 with native numbers', () => {
      const engine = createNativeEngine([
        ['=0.1+0.2'],
        ['=A1=0.3'],
        ['=A1-0.3'],
      ])

      const sum = engine.getCellValue(adr('A1')) as number
      const isEqual = engine.getCellValue(adr('A2'))
      const diff = engine.getCellValue(adr('A3')) as number

      // Sum is close but not exact
      expect(sum).toBeCloseTo(0.3, 15)
      expect(sum).not.toBe(0.3)
      
      // Comparison fails
      expect(isEqual).toBe(false)
      
      // Difference is tiny but not zero
      expect(diff).not.toBe(0)
      expect(Math.abs(diff)).toBeLessThan(1e-15)
    })

    it('DEMO: 0.1 * 0.2 !== 0.02 with native numbers', () => {
      const engine = createNativeEngine([
        ['=0.1*0.2'],
        ['=A1=0.02'],
      ])

      const product = engine.getCellValue(adr('A1')) as number

      expect(product).toBeCloseTo(0.02, 15)
      // Comparison may or may not fail depending on exact representation
    })

    it('DEMO: 1.0 - 0.9 - 0.1 !== 0 with native numbers', () => {
      const engine = createNativeEngine([
        ['=1.0-0.9-0.1'],
        ['=A1=0'],
      ])

      const result = engine.getCellValue(adr('A1')) as number

      expect(result).toBeCloseTo(0, 15)
      expect(result).not.toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(false)
    })

    it('DEMO: 0.3 - 0.1 !== 0.2 with native numbers', () => {
      const engine = createNativeEngine([
        ['=0.3-0.1'],
        ['=A1=0.2'],
      ])

      const result = engine.getCellValue(adr('A1')) as number

      expect(result).toBeCloseTo(0.2, 15)
      // The exact behavior depends on the specific values
    })
  })

  describe('Native: Basic Arithmetic (works correctly)', () => {

    it('Integer arithmetic works correctly', () => {
      const engine = createNativeEngine([
        ['=100+200'],
        ['=A1=300'],
        ['=500-200'],
        ['=A3=300'],
        ['=15*20'],
        ['=A5=300'],
        ['=600/2'],
        ['=A7=300'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(300)
      expect(engine.getCellValue(adr('A2'))).toBe(true)
      expect(engine.getCellValue(adr('A3'))).toBe(300)
      expect(engine.getCellValue(adr('A4'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(300)
      expect(engine.getCellValue(adr('A6'))).toBe(true)
      expect(engine.getCellValue(adr('A7'))).toBe(300)
      expect(engine.getCellValue(adr('A8'))).toBe(true)
    })

    it('Powers of 2 fractions work correctly', () => {
      // 1/2, 1/4, 1/8 etc. can be represented exactly in binary
      const engine = createNativeEngine([
        ['=0.5+0.25'],
        ['=A1=0.75'],
        ['=0.125+0.125'],
        ['=A3=0.25'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0.75)
      expect(engine.getCellValue(adr('A2'))).toBe(true)
      expect(engine.getCellValue(adr('A3'))).toBe(0.25)
      expect(engine.getCellValue(adr('A4'))).toBe(true)
    })
  })

  describe('Native: Financial Calculations (precision issues)', () => {

    it('Sum of 100 pennies may not equal exactly $1.00', () => {
      const rows: (string | number | null)[][] = []
      for (let i = 0; i < 100; i++) {
        rows.push(['=0.01'])
      }
      rows.push(['=SUM(A1:A100)'])
      rows.push(['=A101=1'])
      rows.push(['=A101-1'])

      const engine = createNativeEngine(rows)

      const sum = engine.getCellValue(adr('A101')) as number

      expect(sum).toBeCloseTo(1, 10)
      // With native, the sum might not be exactly 1
    })

    it('Currency round-trip may lose precision', () => {
      const engine = createNativeEngine([
        ['=2.78'],
        ['=A1*100'],
        ['=A2/100'],
        ['=A1=A3'],
        ['=A1-A3'],
      ])

      const original = engine.getCellValue(adr('A1')) as number
      const cents = engine.getCellValue(adr('A2')) as number
      const roundTrip = engine.getCellValue(adr('A3')) as number
      
      expect(original).toBeCloseTo(2.78, 10)
      expect(cents).toBeCloseTo(278, 10)
      expect(roundTrip).toBeCloseTo(2.78, 10)
    })

    it('Tax calculation may have small errors', () => {
      const engine = createNativeEngine([
        ['=99.99'],
        ['=A1*0.0825'],  // 8.25% tax
        ['=A1+A2'],
      ])

      const tax = engine.getCellValue(adr('A2')) as number
      const total = engine.getCellValue(adr('A3')) as number
      
      expect(tax).toBeCloseTo(8.249175, 6)
      expect(total).toBeCloseTo(108.239175, 6)
    })

    it('Repeated operations accumulate errors', () => {
      // Add 0.1 ten times
      const engine = createNativeEngine([
        ['=0.1'],
        ['=A1+0.1'],
        ['=A2+0.1'],
        ['=A3+0.1'],
        ['=A4+0.1'],
        ['=A5+0.1'],
        ['=A6+0.1'],
        ['=A7+0.1'],
        ['=A8+0.1'],
        ['=A9+0.1'],  // Should be 1.0
        ['=A10=1'],
        ['=A10-1'],
      ])

      const sum = engine.getCellValue(adr('A10')) as number
      const isOne = engine.getCellValue(adr('A11'))
      const diff = engine.getCellValue(adr('A12')) as number

      expect(sum).toBeCloseTo(1, 10)
      // With native, comparison may fail
      expect(isOne).toBe(false)
      expect(Math.abs(diff)).toBeLessThan(1e-14)
    })
  })

  describe('Native: Mathematical Functions', () => {

    it('Trigonometric functions work', () => {
      const engine = createNativeEngine([
        ['=SIN(0)'],
        ['=COS(0)'],
        ['=TAN(0)'],
        ['=PI()'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(1)
      expect(engine.getCellValue(adr('A3'))).toBe(0)
      expect(engine.getCellValue(adr('A4'))).toBeCloseTo(Math.PI, 14)
    })

    it('Square root and powers work', () => {
      const engine = createNativeEngine([
        ['=SQRT(16)'],
        ['=SQRT(2)'],
        ['=2^10'],
        ['=10^3'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(4)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(Math.SQRT2, 15)
      expect(engine.getCellValue(adr('A3'))).toBe(1024)
      expect(engine.getCellValue(adr('A4'))).toBe(1000)
    })

    it('Logarithms and exponentials work', () => {
      const engine = createNativeEngine([
        ['=LN(1)'],
        ['=LOG10(100)'],
        ['=EXP(0)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(2)
      expect(engine.getCellValue(adr('A3'))).toBe(1)
    })
  })

  describe('Native: Rounding Functions', () => {

    it('ROUND function works', () => {
      const engine = createNativeEngine([
        ['=ROUND(2.5, 0)'],
        ['=ROUND(2.4, 0)'],
        ['=ROUND(2.567, 2)'],
        ['=ROUND(-2.5, 0)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(3)
      expect(engine.getCellValue(adr('A2'))).toBe(2)
      expect(engine.getCellValue(adr('A3'))).toBe(2.57)
      expect(engine.getCellValue(adr('A4'))).toBe(-3)
    })

    it('TRUNC function works', () => {
      const engine = createNativeEngine([
        ['=TRUNC(2.9, 0)'],
        ['=TRUNC(-2.9, 0)'],
        ['=TRUNC(2.567, 2)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(2)
      expect(engine.getCellValue(adr('A2'))).toBe(-2)
      expect(engine.getCellValue(adr('A3'))).toBe(2.56)
    })

    it('CEILING and FLOOR work', () => {
      const engine = createNativeEngine([
        ['=CEILING(2.1, 1)'],
        ['=FLOOR(2.9, 1)'],
        ['=CEILING(-2.1, 1)'],
        ['=FLOOR(-2.9, 1)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBe(3)
      expect(engine.getCellValue(adr('A2'))).toBe(2)
      expect(engine.getCellValue(adr('A3'))).toBe(-2)
      expect(engine.getCellValue(adr('A4'))).toBe(-3)
    })
  })

  describe('Comparison: Precise vs Native', () => {

    it('Precise handles 0.1+0.2=0.3, Native does not', () => {
      const preciseEngine = createPreciseEngine([
        ['=0.1+0.2'],
        ['=A1=0.3'],
      ])

      const nativeEngine = createNativeEngine([
        ['=0.1+0.2'],
        ['=A1=0.3'],
      ])

      // Precise: exact
      expect(preciseEngine.getCellValue(adr('A1'))).toBe(0.3)
      expect(preciseEngine.getCellValue(adr('A2'))).toBe(true)

      // Native: not exact
      const nativeSum = nativeEngine.getCellValue(adr('A1')) as number

      expect(nativeSum).toBeCloseTo(0.3, 15)
      expect(nativeSum).not.toBe(0.3)
      expect(nativeEngine.getCellValue(adr('A2'))).toBe(false)
    })

    it('Both handle integers correctly', () => {
      const preciseEngine = createPreciseEngine([
        ['=12345+67890'],
        ['=A1=80235'],
      ])

      const nativeEngine = createNativeEngine([
        ['=12345+67890'],
        ['=A1=80235'],
      ])

      expect(preciseEngine.getCellValue(adr('A1'))).toBe(80235)
      expect(preciseEngine.getCellValue(adr('A2'))).toBe(true)
      expect(nativeEngine.getCellValue(adr('A1'))).toBe(80235)
      expect(nativeEngine.getCellValue(adr('A2'))).toBe(true)
    })

    it('Precise maintains precision in chain, Native drifts', () => {
      // Add 0.1 ten times
      const data: (string | number | null)[][] = [['=0.1']]
      for (let i = 0; i < 9; i++) {
        data.push([`=A${data.length}+0.1`])
      }
      data.push(['=A10=1'])

      const preciseEngine = createPreciseEngine(data)
      const nativeEngine = createNativeEngine(data)

      // Precise: exact
      expect(preciseEngine.getCellValue(adr('A10'))).toBe(1)
      expect(preciseEngine.getCellValue(adr('A11'))).toBe(true)

      // Native: drifts
      const nativeSum = nativeEngine.getCellValue(adr('A10')) as number

      expect(nativeSum).toBeCloseTo(1, 10)
      expect(nativeEngine.getCellValue(adr('A11'))).toBe(false)
    })
  })
})
