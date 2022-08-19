import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function RATE', () => {
  const requiredFinancialPrecision = 6 // epsilon = 0.0000005

  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(1,1)', '=RATE(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return #NUM if algorithm does not converge', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(12, -100, 100)', ],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM))
  })

  it('should return #VALUE if guess param is invalid', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(12, -100, 400, 0, 0, -1)', ],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE))
  })

  it('should set the value type to percent', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(12, -100, 400)', ],
    ])

    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  describe('should compute the correct result when type = 0 for', () => {
    it('(12, -100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, -100, 400)', ],
        ['=RATE(12, -100, 400, 0, 0)', ],
        ['=RATE(12, -100, 400, 100, 0)', ],
        ['=RATE(12, -100, 400, -100, 0)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.222595, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.234770, requiredFinancialPrecision)
    })

    it('(12, 100, -400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, -400)', ],
        ['=RATE(12, 100, -400, 0, 0)', ],
        ['=RATE(12, 100, -400, 100, 0)', ],
        ['=RATE(12, 100, -400, -100, 0)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.234770, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.222595, requiredFinancialPrecision)
    })

    it('(12, 100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, 400, -2000, 0)', ],
        ['=RATE(12, 100, 400, -1000, 0)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.030711, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.069686, requiredFinancialPrecision)
    })

    it('(0.9, -100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(0.9, -100, 400)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.796172, requiredFinancialPrecision)
    })

    it('(300, -465.96, 100000)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(300, -465.96, 100000)'],
        ['=RATE(300, -465.96, 100000, 0, 0)'],
        ['=RATE(300, -465.96, 100000, 0, 0, 0.008)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.002367, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.002367, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.002367, requiredFinancialPrecision)
    })

    it('(200, -500, 200000)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(200, -500, 200000)'],
        ['=RATE(200, -500, 200000, 0, 0)'],
        ['=RATE(200, -500, 200000, 0, 0, -0.001)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.006237, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.006237, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.006237, requiredFinancialPrecision)
    })
  })

  describe('should compute the correct result when type = 1 for', () => {
    it('(12, -100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, -100, 400, 100, 1)', ],
        ['=RATE(12, -100, 400, 1, 1)', ],
        ['=RATE(12, -100, 400, 0, 1)', ],
        ['=RATE(12, -100, 400, 0, 1, 0.317)', ],
        ['=RATE(12, -100, 400, -100, 1)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.499693, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.990099, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-1.000000, requiredFinancialPrecision) // noted in known-limitations
      expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.3172435, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM))
    })

    it('(12, -100, 600)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, -100, 600, 0, 1)', ],
        ['=RATE(12, -100, 600, 100, 1)', ],
        ['=RATE(12, -100, 600, -100, 1)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.161450, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.152452, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.169426, requiredFinancialPrecision)
    })

    it('(12, 100, -600)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, -600, 0, 1)', ],
        ['=RATE(12, 100, -600, 100, 1)', ],
        ['=RATE(12, 100, -600, -100, 1)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.161450, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.169426, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.152452, requiredFinancialPrecision)
    })

    it('(12, 100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, 400, -2000, 1)', ],
        ['=RATE(12, 100, 400, -1000, 1)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.028023, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.061540, requiredFinancialPrecision)
    })
  })

  describe('should compute the correct result when guess is provided for', () => {
    it('(12, -100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, -100, 400, 0, 0, 0.23)', ],
        ['=RATE(12, -100, 400, 100, 0, 0.22)', ],
        ['=RATE(12, -100, 400, -100, 0, 0.23)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.222595, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.234770, requiredFinancialPrecision)
    })

    it('(12, -100, 600)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, -100, 600, 0, 1, 0.16)', ],
        ['=RATE(12, -100, 600, 100, 1, 0.1)', ],
        ['=RATE(12, -100, 600, -100, 1, 0.2)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.161450, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.152452, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.169426, requiredFinancialPrecision)
    })

    it('(12, 100, -400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, -400, 0, 0, 0.23)', ],
        ['=RATE(12, 100, -400, 100, 0, 0.23)', ],
        ['=RATE(12, 100, -400, -100, 0, 0.22)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.234770, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.222595, requiredFinancialPrecision)
    })

    it('(12, 100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(12, 100, 400, -2000, 0, 0.03)', ],
        ['=RATE(12, 100, 400, -1000, 0, -0.07)', ],
        ['=RATE(12, 100, 400, -2000, 1, 0.01)', ],
        ['=RATE(12, 100, 400, -1000, 1, -0.01)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.030711, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.069686, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.028023, requiredFinancialPrecision)
      expect(engine.getCellValue(adr('A4'))).toBeCloseTo(-0.061540, requiredFinancialPrecision)
    })

    it('(0.9, -100, 400)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=RATE(0.9, -100, 400, 0, 0, -0.8)', ],
      ])

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.796172, requiredFinancialPrecision)
    })
  })
})
