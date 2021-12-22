import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function RANDBETWEEN', () => {
  it('works with regular input', () => {
    const arr: number[] = Array(10).fill(0)
    for (let i = 0; i < 100; i++) {
      const [engine] = HyperFormula.buildFromArray([
        ['=RANDBETWEEN(0,9)'],
      ])
      const val = engine.getCellValue(adr('A1')) as number
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(9)
      expect(val).toEqual(Math.trunc(val))
      arr[val] += 1
    }
    for (const val of arr) {
      expect(val).toBeGreaterThan(0)
    }
  })

  it('rounds arguments', () => {
    const arr: number[] = Array(10).fill(0)
    for (let i = 0; i < 100; i++) {
      const [engine] = HyperFormula.buildFromArray([
        ['=RANDBETWEEN(-0.1,9.9)'],
      ])
      const val = engine.getCellValue(adr('A1')) as number
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(9)
      expect(val).toEqual(Math.trunc(val))
      arr[val] += 1
    }
    for (const val of arr) {
      expect(val).toBeGreaterThan(0)
    }
  })

  it('should work for short intervals', () => {
    for (let i = 0; i < 10; i++) {
      const [engine] = HyperFormula.buildFromArray([
        ['=RANDBETWEEN(0,0.5)'],
      ])
      const val = engine.getCellValue(adr('A1')) as number
      expect(val).toEqual(0)
    }
  })

  it('should work for short intervals #2', () => {
    for (let i = 0; i < 10; i++) {
      const [engine] = HyperFormula.buildFromArray([
        ['=RANDBETWEEN(0.5,1)'],
      ])
      const val = engine.getCellValue(adr('A1')) as number
      expect(val).toEqual(1)
    }
  })

  it('should work for short intervals #3', () => {
    for (let i = 0; i < 10; i++) {
      const [engine] = HyperFormula.buildFromArray([
        ['=RANDBETWEEN(0.5,0.6)'],
      ])
      const val = engine.getCellValue(adr('A1')) as number
      expect(val).toEqual(1)
    }
  })

  it('validates bounds on arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RANDBETWEEN(0.7,0.5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WrongOrder))
  })

  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RANDBETWEEN(42)'],
      ['=RANDBETWEEN(1,2,3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
