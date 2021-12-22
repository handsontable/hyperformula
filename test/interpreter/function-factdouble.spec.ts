import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FACTDOUBLE', () => {
  it('checks number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE()', '=FACTDOUBLE(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE(0)'],
      ['=FACTDOUBLE(1)'],
      ['=FACTDOUBLE(10)'],
      ['=FACTDOUBLE(288)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(3840)
    expect(engine.getCellValue(adr('A4')) as number / 1.23775688540895e+293).toBeCloseTo(1, 6)
  })

  it('rounds argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE(0.9)'],
      ['=FACTDOUBLE(1.1)'],
      ['=FACTDOUBLE(10.42)'],
      ['=FACTDOUBLE(287.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(3840)
    expect(engine.getCellValue(adr('A4')) as number / 5.81436347598024e+291).toBeCloseTo(1, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE(-1)'],
      ['=FACTDOUBLE(289)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('uses coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE("0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('propagates error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FACTDOUBLE(NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
