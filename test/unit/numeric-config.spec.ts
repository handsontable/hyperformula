/**
 * Tests for Precision Number Configuration
 * 
 * These tests verify that HyperFormula correctly configures the precision
 * number system based on user options.
 */

import {
  HyperFormula,
  RoundingMode,
  NumericProvider,
  DecimalNumericFactory,
  NativeNumericFactory,
} from '../../src'
import {adr} from './testUtils'

describe('Precision Number Configuration', () => {

  // Reset to default after each test to avoid side effects
  afterEach(() => {
    NumericProvider.resetToDefault()
  })

  describe('numericImplementation option', () => {

    it('should use precise (decimal) by default', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
      ])

      // precise implementation gives exact result
      expect(engine.getCellValue(adr('A1'))).toBe(0.3)
      expect(NumericProvider.getGlobalFactory().getName()).toBe('decimal.js')
    })

    it('should use precise when explicitly specified', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
      ], {
        numericImplementation: 'precise',
      })

      expect(engine.getCellValue(adr('A1'))).toBe(0.3)
      expect(NumericProvider.getGlobalFactory().getName()).toBe('decimal.js')
    })

    it('should use native numbers when specified', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
      ], {
        numericImplementation: 'native',
      })

      // Native JS has precision issues: 0.1 + 0.2 !== 0.3
      const result = engine.getCellValue(adr('A1')) as number
      // The result is approximately 0.3 but not exactly
      expect(result).toBeCloseTo(0.3, 15)
      expect(NumericProvider.getGlobalFactory().getName()).toBe('native')
    })
  })

  describe('numericDigits option', () => {

    it('should use 34 digits by default with precise', () => {
      HyperFormula.buildFromArray([[1]])  // Create engine to trigger config
      
      const config = NumericProvider.getGlobalFactory().getConfig()

      expect(config.precision).toBe(34)
    })

    it('should allow custom precision digits', () => {
      HyperFormula.buildFromArray([[1]], {
        numericImplementation: 'precise',
        numericDigits: 50,
      })
      
      const config = NumericProvider.getGlobalFactory().getConfig()

      expect(config.precision).toBe(50)
    })
  })

  describe('numericRounding option', () => {

    it('should use ROUND_HALF_UP by default', () => {
      HyperFormula.buildFromArray([[1]])
      
      const config = NumericProvider.getGlobalFactory().getConfig()

      expect(config.rounding).toBe(RoundingMode.ROUND_HALF_UP)
    })

    it('should allow ROUND_HALF_EVEN (banker\'s rounding)', () => {
      HyperFormula.buildFromArray([
        ['=ROUND(2.5, 0)'],
      ], {
        numericRounding: RoundingMode.ROUND_HALF_EVEN,
      })
      
      const config = NumericProvider.getGlobalFactory().getConfig()

      expect(config.rounding).toBe(RoundingMode.ROUND_HALF_EVEN)
    })

    it('should allow ROUND_DOWN (truncation)', () => {
      HyperFormula.buildFromArray([[1]], {
        numericRounding: RoundingMode.ROUND_DOWN,
      })
      
      const config = NumericProvider.getGlobalFactory().getConfig()

      expect(config.rounding).toBe(RoundingMode.ROUND_DOWN)
    })

    it('should allow all rounding modes', () => {
      const modes = [
        RoundingMode.ROUND_UP,
        RoundingMode.ROUND_DOWN,
        RoundingMode.ROUND_CEIL,
        RoundingMode.ROUND_FLOOR,
        RoundingMode.ROUND_HALF_UP,
        RoundingMode.ROUND_HALF_DOWN,
        RoundingMode.ROUND_HALF_EVEN,
        RoundingMode.ROUND_HALF_CEIL,
        RoundingMode.ROUND_HALF_FLOOR,
      ]

      for (const mode of modes) {
        HyperFormula.buildFromArray([[1]], {
          numericRounding: mode,
        })
        const config = NumericProvider.getGlobalFactory().getConfig()

        expect(config.rounding).toBe(mode)
      }
    })
  })

  describe('Financial calculation scenarios with precise', () => {

    it('handles currency calculations precisely', () => {
      const engine = HyperFormula.buildFromArray([
        ['=19.99*3'],     // 59.97
        ['=7.49*5'],      // 37.45
        ['=0.99*10'],     // 9.90
        ['=A1+A2+A3'],    // 107.32
      ], {
        numericImplementation: 'precise',
        smartRounding: false,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(59.97)
      expect(engine.getCellValue(adr('A2'))).toBe(37.45)
      expect(engine.getCellValue(adr('A3'))).toBe(9.9)
      expect(engine.getCellValue(adr('A4'))).toBe(107.32)
    })

    it('handles 0.1 + 0.2 = 0.3 exactly', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
        ['=A1=0.3'],
        ['=A1-0.3'],
      ], {
        numericImplementation: 'precise',
        smartRounding: false,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(0.3)
      expect(engine.getCellValue(adr('A2'))).toBe(true)
      expect(engine.getCellValue(adr('A3'))).toBe(0)
    })
  })

  describe('Native implementation behavior', () => {

    it('shows IEEE-754 precision issues with 0.1 + 0.2', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
        ['=A1-0.3'],
      ], {
        numericImplementation: 'native',
        smartRounding: false,
      })

      const sum = engine.getCellValue(adr('A1')) as number
      const diff = engine.getCellValue(adr('A2')) as number
      
      // 0.1 + 0.2 in native JS is NOT exactly 0.3
      expect(sum).toBeCloseTo(0.3, 15)
      expect(sum).not.toBe(0.3)
      
      // The difference is not exactly 0
      expect(diff).not.toBe(0)
      expect(Math.abs(diff)).toBeLessThan(1e-15)
    })

    it('shows IEEE-754 precision issues with 0.1 * 0.2', () => {
      const engine = HyperFormula.buildFromArray([
        ['=0.1*0.2'],
        ['=A1-0.02'],
      ], {
        numericImplementation: 'native',
        smartRounding: false,
      })

      const product = engine.getCellValue(adr('A1')) as number

      expect(product).toBeCloseTo(0.02, 15)
    })

    it('shows IEEE-754 precision issues with 1.0 - 0.9 - 0.1', () => {
      const engine = HyperFormula.buildFromArray([
        ['=1.0-0.9-0.1'],
      ], {
        numericImplementation: 'native',
        smartRounding: false,
      })

      const result = engine.getCellValue(adr('A1')) as number
      // Should be 0, but with native floats it's not
      expect(result).toBeCloseTo(0, 15)
      expect(result).not.toBe(0)
    })

    it('handles large numbers but may lose precision', () => {
      const engine = HyperFormula.buildFromArray([
        ['=1000000000000.01+0.01'],
      ], {
        numericImplementation: 'native',
        smartRounding: false,
      })

      const result = engine.getCellValue(adr('A1')) as number
      // Large numbers lose precision at the decimal level
      expect(result).toBeCloseTo(1000000000000.02, 2)
    })

    it('can perform basic arithmetic correctly', () => {
      const engine = HyperFormula.buildFromArray([
        ['=2+3'],
        ['=10-4'],
        ['=6*7'],
        ['=20/4'],
      ], {
        numericImplementation: 'native',
      })

      expect(engine.getCellValue(adr('A1'))).toBe(5)
      expect(engine.getCellValue(adr('A2'))).toBe(6)
      expect(engine.getCellValue(adr('A3'))).toBe(42)
      expect(engine.getCellValue(adr('A4'))).toBe(5)
    })

    it('handles mathematical functions', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SQRT(16)'],
        ['=ABS(-5)'],
        ['=ROUND(2.5, 0)'],
        ['=TRUNC(3.7, 0)'],
      ], {
        numericImplementation: 'native',
      })

      expect(engine.getCellValue(adr('A1'))).toBe(4)
      expect(engine.getCellValue(adr('A2'))).toBe(5)
      expect(engine.getCellValue(adr('A3'))).toBe(3)
      expect(engine.getCellValue(adr('A4'))).toBe(3)
    })

    it('handles trigonometric functions', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SIN(0)'],
        ['=COS(0)'],
        ['=TAN(0)'],
      ], {
        numericImplementation: 'native',
      })

      expect(engine.getCellValue(adr('A1'))).toBe(0)
      expect(engine.getCellValue(adr('A2'))).toBe(1)
      expect(engine.getCellValue(adr('A3'))).toBe(0)
    })

    it('handles comparison correctly despite precision issues', () => {
      const engine = HyperFormula.buildFromArray([
        ['=2>1'],
        ['=1<2'],
        ['=2=2'],
        ['=2>=2'],
        ['=2<=2'],
      ], {
        numericImplementation: 'native',
      })

      expect(engine.getCellValue(adr('A1'))).toBe(true)
      expect(engine.getCellValue(adr('A2'))).toBe(true)
      expect(engine.getCellValue(adr('A3'))).toBe(true)
      expect(engine.getCellValue(adr('A4'))).toBe(true)
      expect(engine.getCellValue(adr('A5'))).toBe(true)
    })

    it('sum of pennies may accumulate errors', () => {
      // Create array of 100 cells with 0.01
      const rows: (string | number)[][] = []
      for (let i = 0; i < 100; i++) {
        rows.push(['=0.01'])
      }
      rows.push(['=SUM(A1:A100)'])

      const engine = HyperFormula.buildFromArray(rows, {
        numericImplementation: 'native',
        smartRounding: false,
      })

      const sum = engine.getCellValue(adr('A101')) as number
      // With native numbers, sum may not be exactly 1
      expect(sum).toBeCloseTo(1, 10)
    })
  })

  describe('Configuration persistence', () => {

    it('configuration should persist across engine creations', () => {
      // First engine sets precise
      HyperFormula.buildFromArray([[1]], {
        numericImplementation: 'precise',
        numericDigits: 40,
      })

      expect(NumericProvider.getGlobalFactory().getName()).toBe('decimal.js')
      expect(NumericProvider.getGlobalFactory().getConfig().precision).toBe(40)

      // Second engine changes to native
      HyperFormula.buildFromArray([[1]], {
        numericImplementation: 'native',
      })

      expect(NumericProvider.getGlobalFactory().getName()).toBe('native')
    })

    it('getConfig returns current precision configuration', () => {
      const engine = HyperFormula.buildFromArray([[1]], {
        numericImplementation: 'precise',
        numericDigits: 50,
        numericRounding: RoundingMode.ROUND_HALF_EVEN,
      })

      const config = engine.getConfig()

      expect(config.numericImplementation).toBe('precise')
      expect(config.numericDigits).toBe(50)
      expect(config.numericRounding).toBe(RoundingMode.ROUND_HALF_EVEN)
    })
  })

  describe('Factory classes', () => {

    it('DecimalNumericFactory should be available for custom use', () => {
      const factory = new DecimalNumericFactory()
      const num = factory.create('0.1').plus(factory.create('0.2'))

      expect(num.toString()).toBe('0.3')
    })

    it('NativeNumericFactory should be available for custom use', () => {
      const factory = new NativeNumericFactory()
      const num = factory.create(0.1).plus(factory.create(0.2))
      // Native has precision issues
      expect(num.toNumber()).toBeCloseTo(0.3, 15)
      expect(num.toNumber()).not.toBe(0.3)
    })

    it('Custom factory can be set globally', () => {
      const customFactory = new DecimalNumericFactory()
      customFactory.configure({ precision: 100 })
      
      NumericProvider.setGlobalFactory(customFactory)
      
      expect(NumericProvider.getGlobalFactory().getName()).toBe('decimal.js')
      expect(NumericProvider.getGlobalFactory().getConfig().precision).toBe(100)
    })
  })

  describe('RoundingMode enum values', () => {

    it('should have correct enum values', () => {
      expect(RoundingMode.ROUND_UP).toBe(0)
      expect(RoundingMode.ROUND_DOWN).toBe(1)
      expect(RoundingMode.ROUND_CEIL).toBe(2)
      expect(RoundingMode.ROUND_FLOOR).toBe(3)
      expect(RoundingMode.ROUND_HALF_UP).toBe(4)
      expect(RoundingMode.ROUND_HALF_DOWN).toBe(5)
      expect(RoundingMode.ROUND_HALF_EVEN).toBe(6)
      expect(RoundingMode.ROUND_HALF_CEIL).toBe(7)
      expect(RoundingMode.ROUND_HALF_FLOOR).toBe(8)
    })
  })

  describe('Comparison: precise vs native', () => {

    it('precise handles financial calculation exactly, native does not', () => {
      const preciseEngine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
        ['=A1=0.3'],
      ], {
        numericImplementation: 'precise',
        smartRounding: false,
      })

      NumericProvider.resetToDefault()

      const nativeEngine = HyperFormula.buildFromArray([
        ['=0.1+0.2'],
        ['=A1=0.3'],
      ], {
        numericImplementation: 'native',
        smartRounding: false,
      })

      // Precise: exact
      expect(preciseEngine.getCellValue(adr('A1'))).toBe(0.3)
      expect(preciseEngine.getCellValue(adr('A2'))).toBe(true)

      // Native: not exact
      const nativeSum = nativeEngine.getCellValue(adr('A1')) as number

      expect(nativeSum).toBeCloseTo(0.3, 15)
      expect(nativeSum).not.toBe(0.3)
    })

    it('both handle integers correctly', () => {
      const preciseEngine = HyperFormula.buildFromArray([
        ['=100+200'],
        ['=A1=300'],
      ], {
        numericImplementation: 'precise',
      })

      NumericProvider.resetToDefault()

      const nativeEngine = HyperFormula.buildFromArray([
        ['=100+200'],
        ['=A1=300'],
      ], {
        numericImplementation: 'native',
      })

      expect(preciseEngine.getCellValue(adr('A1'))).toBe(300)
      expect(preciseEngine.getCellValue(adr('A2'))).toBe(true)
      expect(nativeEngine.getCellValue(adr('A1'))).toBe(300)
      expect(nativeEngine.getCellValue(adr('A2'))).toBe(true)
    })
  })
})
