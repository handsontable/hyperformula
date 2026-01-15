/**
 * Tests for Numeric implementations to ensure coverage.
 * These tests cover methods not exercised by the main HyperFormula tests.
 */

import { DecimalNumericFactory, DecimalNumeric } from '../../src/Numeric/implementations/DecimalNumeric'
import { NativeNumericFactory, NativeNumeric } from '../../src/Numeric/implementations/NativeNumeric'
import { NumericProvider, pn } from '../../src/Numeric/NumericProvider'
import { RoundingMode } from '../../src/Numeric/Numeric'

describe('DecimalNumeric coverage', () => {
  let factory: DecimalNumericFactory

  beforeEach(() => {
    factory = new DecimalNumericFactory()
  })

  describe('Mathematical functions', () => {
    it('should compute sqrt', () => {
      const num = factory.create(16)

      expect(num.sqrt().toNumber()).toBe(4)
    })

    it('should compute mod', () => {
      const num = factory.create(10)
      const divisor = factory.create(3)

      expect(num.mod(divisor).toNumber()).toBe(1)
    })

    it('should compute ln', () => {
      const num = factory.create(Math.E)

      expect(num.ln().toNumber()).toBeCloseTo(1, 10)
    })

    it('should compute log10', () => {
      const num = factory.create(100)

      expect(num.log10().toNumber()).toBe(2)
    })

    it('should compute exp', () => {
      const num = factory.create(1)

      expect(num.exp().toNumber()).toBeCloseTo(Math.E, 10)
    })

    it('should compute sin', () => {
      const num = factory.create(0)

      expect(num.sin().toNumber()).toBe(0)
    })

    it('should compute cos', () => {
      const num = factory.create(0)

      expect(num.cos().toNumber()).toBe(1)
    })

    it('should compute tan', () => {
      const num = factory.create(0)

      expect(num.tan().toNumber()).toBe(0)
    })

    it('should compute asin', () => {
      const num = factory.create(0)

      expect(num.asin().toNumber()).toBe(0)
    })

    it('should compute acos', () => {
      const num = factory.create(1)

      expect(num.acos().toNumber()).toBe(0)
    })

    it('should compute atan', () => {
      const num = factory.create(0)

      expect(num.atan().toNumber()).toBe(0)
    })

    it('should compute sinh', () => {
      const num = factory.create(0)

      expect(num.sinh().toNumber()).toBe(0)
    })

    it('should compute cosh', () => {
      const num = factory.create(0)

      expect(num.cosh().toNumber()).toBe(1)
    })

    it('should compute tanh', () => {
      const num = factory.create(0)

      expect(num.tanh().toNumber()).toBe(0)
    })

    it('should compute asinh', () => {
      const num = factory.create(0)

      expect(num.asinh().toNumber()).toBe(0)
    })

    it('should compute acosh', () => {
      const num = factory.create(1)

      expect(num.acosh().toNumber()).toBe(0)
    })

    it('should compute atanh', () => {
      const num = factory.create(0)

      expect(num.atanh().toNumber()).toBe(0)
    })
  })

  describe('Rounding operations', () => {
    it('should floor', () => {
      const num = factory.create(3.7)

      expect(num.floor().toNumber()).toBe(3)
    })

    it('should ceil', () => {
      const num = factory.create(3.2)

      expect(num.ceil().toNumber()).toBe(4)
    })

    it('should round', () => {
      const num = factory.create(3.5)

      expect(num.round().toNumber()).toBe(4)
    })

    it('should trunc', () => {
      const num = factory.create(-3.7)

      expect(num.trunc().toNumber()).toBe(-3)
    })

    it('should toDecimalPlaces with rounding mode', () => {
      const num = factory.create(3.456)

      expect(num.toDecimalPlaces(2, RoundingMode.ROUND_DOWN).toNumber()).toBe(3.45)
    })

    it('should toDecimalPlaces without rounding mode', () => {
      const num = factory.create(3.456)

      expect(num.toDecimalPlaces(2).toNumber()).toBe(3.46)
    })

    it('should toSignificantDigits with rounding mode', () => {
      const num = factory.create(1234.5)

      expect(num.toSignificantDigits(3, RoundingMode.ROUND_DOWN).toNumber()).toBe(1230)
    })

    it('should toSignificantDigits without rounding mode', () => {
      const num = factory.create(1234.5)

      expect(num.toSignificantDigits(3).toNumber()).toBe(1230)
    })
  })

  describe('Comparison operations', () => {
    it('should compare equal values', () => {
      const a = factory.create(5)
      const b = factory.create(5)

      expect(a.equals(b)).toBe(true)
    })

    it('should compare greaterThan', () => {
      const a = factory.create(5)
      const b = factory.create(3)

      expect(a.greaterThan(b)).toBe(true)
    })

    it('should compare greaterThanOrEqualTo', () => {
      const a = factory.create(5)
      const b = factory.create(5)

      expect(a.greaterThanOrEqualTo(b)).toBe(true)
    })

    it('should compare lessThan', () => {
      const a = factory.create(3)
      const b = factory.create(5)

      expect(a.lessThan(b)).toBe(true)
    })

    it('should compare lessThanOrEqualTo', () => {
      const a = factory.create(5)
      const b = factory.create(5)

      expect(a.lessThanOrEqualTo(b)).toBe(true)
    })
  })

  describe('Predicates', () => {
    it('should detect zero', () => {
      expect(factory.create(0).isZero()).toBe(true)
      expect(factory.create(1).isZero()).toBe(false)
    })

    it('should detect negative', () => {
      expect(factory.create(-1).isNegative()).toBe(true)
      expect(factory.create(1).isNegative()).toBe(false)
    })

    it('should detect positive', () => {
      expect(factory.create(1).isPositive()).toBe(true)
      expect(factory.create(-1).isPositive()).toBe(false)
    })

    it('should detect integer', () => {
      expect(factory.create(5).isInteger()).toBe(true)
      expect(factory.create(5.5).isInteger()).toBe(false)
    })

    it('should detect finite', () => {
      expect(factory.create(5).isFinite()).toBe(true)
      expect(factory.POSITIVE_INFINITY().isFinite()).toBe(false)
    })

    it('should detect NaN', () => {
      expect(factory.NaN().isNaN()).toBe(true)
      expect(factory.create(5).isNaN()).toBe(false)
    })
  })

  describe('Conversion operations', () => {
    it('should convert toFixed', () => {
      const num = factory.create(3.14159)

      expect(num.toFixed(2)).toBe('3.14')
    })

    it('should convert toExponential', () => {
      const num = factory.create(12345)

      expect(num.toExponential(2)).toBe('1.23e+4')
    })

    it('should valueOf', () => {
      const num = factory.create(42)

      expect(num.valueOf()).toBe(42)
    })

    it('should getInternalValue', () => {
      const num = factory.create(42) as DecimalNumeric

      expect(num.getInternalValue().toNumber()).toBe(42)
    })
  })

  describe('Factory methods', () => {
    it('should create one', () => {
      expect(factory.one().toNumber()).toBe(1)
    })

    it('should create from number', () => {
      expect(factory.fromNumber(42).toNumber()).toBe(42)
    })

    it('should create from string', () => {
      expect(factory.fromString('42.5').toNumber()).toBe(42.5)
    })

    it('should create PI', () => {
      expect(factory.PI().toNumber()).toBeCloseTo(Math.PI, 10)
    })

    it('should create E', () => {
      expect(factory.E().toNumber()).toBeCloseTo(Math.E, 10)
    })

    it('should create POSITIVE_INFINITY', () => {
      expect(factory.POSITIVE_INFINITY().toNumber()).toBe(Infinity)
    })

    it('should create NEGATIVE_INFINITY', () => {
      expect(factory.NEGATIVE_INFINITY().toNumber()).toBe(-Infinity)
    })

    it('should create NaN', () => {
      expect(factory.NaN().isNaN()).toBe(true)
    })

    it('should configure and getConfig', () => {
      factory.configure({ precision: 50 })

      expect(factory.getConfig().precision).toBe(50)
    })

    it('should getName', () => {
      expect(factory.getName()).toBe('decimal.js')
    })

    it('should create from another Numeric', () => {
      const native = new NativeNumeric(42)
      const decimal = factory.create(native)

      expect(decimal.toNumber()).toBe(42)
    })

    it('should pass through DecimalNumeric', () => {
      const num = factory.create(42)
      const same = factory.create(num)

      expect(same).toBe(num)
    })
  })
})

describe('NativeNumeric coverage', () => {
  let factory: NativeNumericFactory

  beforeEach(() => {
    factory = new NativeNumericFactory()
  })

  describe('Mathematical functions', () => {
    it('should compute sqrt', () => {
      const num = factory.create(16)

      expect(num.sqrt().toNumber()).toBe(4)
    })

    it('should compute mod', () => {
      const num = factory.create(10)
      const divisor = factory.create(3)

      expect(num.mod(divisor).toNumber()).toBe(1)
    })

    it('should compute ln', () => {
      const num = factory.create(Math.E)

      expect(num.ln().toNumber()).toBeCloseTo(1, 10)
    })

    it('should compute log10', () => {
      const num = factory.create(100)

      expect(num.log10().toNumber()).toBe(2)
    })

    it('should compute exp', () => {
      const num = factory.create(1)

      expect(num.exp().toNumber()).toBeCloseTo(Math.E, 10)
    })

    it('should compute sin', () => {
      const num = factory.create(0)

      expect(num.sin().toNumber()).toBe(0)
    })

    it('should compute cos', () => {
      const num = factory.create(0)

      expect(num.cos().toNumber()).toBe(1)
    })

    it('should compute tan', () => {
      const num = factory.create(0)

      expect(num.tan().toNumber()).toBe(0)
    })

    it('should compute asin', () => {
      const num = factory.create(0)

      expect(num.asin().toNumber()).toBe(0)
    })

    it('should compute acos', () => {
      const num = factory.create(1)

      expect(num.acos().toNumber()).toBe(0)
    })

    it('should compute atan', () => {
      const num = factory.create(0)

      expect(num.atan().toNumber()).toBe(0)
    })

    it('should compute sinh', () => {
      const num = factory.create(0)

      expect(num.sinh().toNumber()).toBe(0)
    })

    it('should compute cosh', () => {
      const num = factory.create(0)

      expect(num.cosh().toNumber()).toBe(1)
    })

    it('should compute tanh', () => {
      const num = factory.create(0)

      expect(num.tanh().toNumber()).toBe(0)
    })

    it('should compute asinh', () => {
      const num = factory.create(0)

      expect(num.asinh().toNumber()).toBe(0)
    })

    it('should compute acosh', () => {
      const num = factory.create(1)

      expect(num.acosh().toNumber()).toBe(0)
    })

    it('should compute atanh', () => {
      const num = factory.create(0)

      expect(num.atanh().toNumber()).toBe(0)
    })
  })

  describe('Rounding operations', () => {
    it('should floor', () => {
      const num = factory.create(3.7)

      expect(num.floor().toNumber()).toBe(3)
    })

    it('should ceil', () => {
      const num = factory.create(3.2)

      expect(num.ceil().toNumber()).toBe(4)
    })

    it('should round', () => {
      const num = factory.create(3.5)

      expect(num.round().toNumber()).toBe(4)
    })

    it('should trunc', () => {
      const num = factory.create(-3.7)

      expect(num.trunc().toNumber()).toBe(-3)
    })

    it('should toDecimalPlaces with ROUND_UP', () => {
      expect(factory.create(3.451).toDecimalPlaces(2, RoundingMode.ROUND_UP).toNumber()).toBe(3.46)
      expect(factory.create(-3.451).toDecimalPlaces(2, RoundingMode.ROUND_UP).toNumber()).toBe(-3.46)
    })

    it('should toDecimalPlaces with ROUND_DOWN', () => {
      expect(factory.create(3.459).toDecimalPlaces(2, RoundingMode.ROUND_DOWN).toNumber()).toBe(3.45)
    })

    it('should toDecimalPlaces with ROUND_CEIL', () => {
      expect(factory.create(3.451).toDecimalPlaces(2, RoundingMode.ROUND_CEIL).toNumber()).toBe(3.46)
    })

    it('should toDecimalPlaces with ROUND_FLOOR', () => {
      expect(factory.create(3.459).toDecimalPlaces(2, RoundingMode.ROUND_FLOOR).toNumber()).toBe(3.45)
    })

    it('should toDecimalPlaces with ROUND_HALF_DOWN', () => {
      expect(factory.create(3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_DOWN).toNumber()).toBe(3.45)
      expect(factory.create(-3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_DOWN).toNumber()).toBe(-3.45)
    })

    it('should toDecimalPlaces with ROUND_HALF_EVEN', () => {
      expect(factory.create(3.445).toDecimalPlaces(2, RoundingMode.ROUND_HALF_EVEN).toNumber()).toBe(3.44)
      expect(factory.create(3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_EVEN).toNumber()).toBe(3.46)
      expect(factory.create(3.465).toDecimalPlaces(2, RoundingMode.ROUND_HALF_EVEN).toNumber()).toBe(3.46)
    })

    it('should toDecimalPlaces with ROUND_HALF_CEIL', () => {
      expect(factory.create(3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_CEIL).toNumber()).toBe(3.46)
    })

    it('should toDecimalPlaces with ROUND_HALF_FLOOR', () => {
      expect(factory.create(3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_FLOOR).toNumber()).toBe(3.45)
    })

    it('should toDecimalPlaces with ROUND_HALF_UP (default)', () => {
      expect(factory.create(3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP).toNumber()).toBe(3.46)
      expect(factory.create(-3.455).toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP).toNumber()).toBe(-3.46)
    })

    it('should toDecimalPlaces without rounding mode', () => {
      expect(factory.create(3.456).toDecimalPlaces(2).toNumber()).toBe(3.46)
    })

    it('should toSignificantDigits', () => {
      expect(factory.create(1234.5).toSignificantDigits(3).toNumber()).toBe(1230)
    })

    it('should toSignificantDigits with zero', () => {
      expect(factory.create(0).toSignificantDigits(3).toNumber()).toBe(0)
    })
  })

  describe('Comparison operations', () => {
    it('should comparedTo return -1 for less', () => {
      expect(factory.create(3).comparedTo(factory.create(5))).toBe(-1)
    })

    it('should comparedTo return 1 for greater', () => {
      expect(factory.create(5).comparedTo(factory.create(3))).toBe(1)
    })

    it('should comparedTo return 0 for equal', () => {
      expect(factory.create(5).comparedTo(factory.create(5))).toBe(0)
    })

    it('should equals', () => {
      expect(factory.create(5).equals(factory.create(5))).toBe(true)
    })

    it('should greaterThan', () => {
      expect(factory.create(5).greaterThan(factory.create(3))).toBe(true)
    })

    it('should greaterThanOrEqualTo', () => {
      expect(factory.create(5).greaterThanOrEqualTo(factory.create(5))).toBe(true)
    })

    it('should lessThan', () => {
      expect(factory.create(3).lessThan(factory.create(5))).toBe(true)
    })

    it('should lessThanOrEqualTo', () => {
      expect(factory.create(5).lessThanOrEqualTo(factory.create(5))).toBe(true)
    })
  })

  describe('Predicates', () => {
    it('should detect zero', () => {
      expect(factory.create(0).isZero()).toBe(true)
    })

    it('should detect negative', () => {
      expect(factory.create(-1).isNegative()).toBe(true)
    })

    it('should detect positive', () => {
      expect(factory.create(1).isPositive()).toBe(true)
    })

    it('should detect integer', () => {
      expect(factory.create(5).isInteger()).toBe(true)
    })

    it('should detect finite', () => {
      expect(factory.create(5).isFinite()).toBe(true)
    })

    it('should detect NaN', () => {
      expect(factory.NaN().isNaN()).toBe(true)
    })
  })

  describe('Conversion operations', () => {
    it('should toFixed', () => {
      expect(factory.create(3.14159).toFixed(2)).toBe('3.14')
    })

    it('should toExponential', () => {
      expect(factory.create(12345).toExponential(2)).toBe('1.23e+4')
    })

    it('should valueOf', () => {
      expect(factory.create(42).valueOf()).toBe(42)
    })

    it('should getInternalValue', () => {
      const num = factory.create(42) as NativeNumeric

      expect(num.getInternalValue()).toBe(42)
    })
  })

  describe('Factory methods', () => {
    it('should create one', () => {
      expect(factory.one().toNumber()).toBe(1)
    })

    it('should create from number', () => {
      expect(factory.fromNumber(42).toNumber()).toBe(42)
    })

    it('should create from string', () => {
      expect(factory.fromString('42.5').toNumber()).toBe(42.5)
    })

    it('should create PI', () => {
      expect(factory.PI().toNumber()).toBe(Math.PI)
    })

    it('should create E', () => {
      expect(factory.E().toNumber()).toBe(Math.E)
    })

    it('should create POSITIVE_INFINITY', () => {
      expect(factory.POSITIVE_INFINITY().toNumber()).toBe(Infinity)
    })

    it('should create NEGATIVE_INFINITY', () => {
      expect(factory.NEGATIVE_INFINITY().toNumber()).toBe(-Infinity)
    })

    it('should create NaN', () => {
      expect(factory.NaN().isNaN()).toBe(true)
    })

    it('should configure and getConfig', () => {
      factory.configure({ precision: 20 })

      expect(factory.getConfig().precision).toBe(20)
    })

    it('should getName', () => {
      expect(factory.getName()).toBe('native')
    })

    it('should create from another Numeric', () => {
      const decimal = new DecimalNumericFactory().create(42)
      const native = factory.create(decimal)

      expect(native.toNumber()).toBe(42)
    })

    it('should pass through NativeNumeric', () => {
      const num = factory.create(42)
      const same = factory.create(num)

      expect(same).toBe(num)
    })
  })
})

describe('NumericProvider coverage', () => {
  describe('Instance methods', () => {
    it('should getFactory', () => {
      const provider = new NumericProvider()

      expect(provider.getFactory()).toBeDefined()
    })

    it('should setFactory', () => {
      const provider = new NumericProvider()
      const newFactory = new NativeNumericFactory()
      provider.setFactory(newFactory)

      expect(provider.getFactory()).toBe(newFactory)
    })

    it('should create', () => {
      const provider = new NumericProvider()

      expect(provider.create(42).toNumber()).toBe(42)
    })

    it('should zero', () => {
      const provider = new NumericProvider()

      expect(provider.zero().toNumber()).toBe(0)
    })

    it('should one', () => {
      const provider = new NumericProvider()

      expect(provider.one().toNumber()).toBe(1)
    })

    it('should fromNumber', () => {
      const provider = new NumericProvider()

      expect(provider.fromNumber(42).toNumber()).toBe(42)
    })

    it('should fromString', () => {
      const provider = new NumericProvider()

      expect(provider.fromString('42.5').toNumber()).toBe(42.5)
    })

    it('should PI', () => {
      const provider = new NumericProvider()

      expect(provider.PI().toNumber()).toBeCloseTo(Math.PI, 10)
    })

    it('should E', () => {
      const provider = new NumericProvider()

      expect(provider.E().toNumber()).toBeCloseTo(Math.E, 10)
    })

    it('should POSITIVE_INFINITY', () => {
      const provider = new NumericProvider()

      expect(provider.POSITIVE_INFINITY().toNumber()).toBe(Infinity)
    })

    it('should NEGATIVE_INFINITY', () => {
      const provider = new NumericProvider()

      expect(provider.NEGATIVE_INFINITY().toNumber()).toBe(-Infinity)
    })

    it('should NaN', () => {
      const provider = new NumericProvider()

      expect(provider.NaN().isNaN()).toBe(true)
    })

    it('should configure', () => {
      const provider = new NumericProvider()
      provider.configure({ precision: 50 })

      expect(provider.getConfig().precision).toBe(50)
    })

    it('should getConfig', () => {
      const provider = new NumericProvider()

      expect(provider.getConfig()).toBeDefined()
    })

    it('should getName', () => {
      const provider = new NumericProvider()

      expect(provider.getName()).toBe('decimal.js')
    })
  })

  describe('Static methods', () => {
    it('should setGlobalFactory and getGlobalFactory', () => {
      const originalFactory = NumericProvider.getGlobalFactory()
      const newFactory = new NativeNumericFactory()
      
      NumericProvider.setGlobalFactory(newFactory)

      expect(NumericProvider.getGlobalFactory()).toBe(newFactory)
      
      // Restore
      NumericProvider.setGlobalFactory(originalFactory)
    })

    it('should configureGlobal', () => {
      NumericProvider.configureGlobal({ precision: 40 })

      expect(NumericProvider.getGlobalFactory().getConfig().precision).toBe(40)
      
      // Restore default
      NumericProvider.resetToDefault()
    })

    it('should resetToDefault', () => {
      NumericProvider.setGlobalFactory(new NativeNumericFactory())
      NumericProvider.resetToDefault()

      expect(NumericProvider.getGlobalFactory().getName()).toBe('decimal.js')
    })

    it('should createGlobal', () => {
      expect(NumericProvider.createGlobal(42).toNumber()).toBe(42)
    })
  })

  describe('pn helper', () => {
    it('should create', () => {
      expect(pn.create(42).toNumber()).toBe(42)
    })

    it('should zero', () => {
      expect(pn.zero().toNumber()).toBe(0)
    })

    it('should one', () => {
      expect(pn.one().toNumber()).toBe(1)
    })

    it('should PI', () => {
      expect(pn.PI().toNumber()).toBeCloseTo(Math.PI, 10)
    })

    it('should E', () => {
      expect(pn.E().toNumber()).toBeCloseTo(Math.E, 10)
    })

    it('should infinity', () => {
      expect(pn.infinity().toNumber()).toBe(Infinity)
    })

    it('should negInfinity', () => {
      expect(pn.negInfinity().toNumber()).toBe(-Infinity)
    })

    it('should nan', () => {
      expect(pn.nan().isNaN()).toBe(true)
    })
  })
})
