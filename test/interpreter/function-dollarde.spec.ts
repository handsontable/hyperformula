import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DOLLARDE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DOLLARDE(1)', '=DOLLARDE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('div/0 when second argument too small', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DOLLARDE(1,0)', '=DOLLARDE(1, 0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      [
        '=DOLLARDE(1.01, 8)',
        '=DOLLARDE(1.0000001, 8.9)',
        '=DOLLARDE(1.1, 100001)',
        '=DOLLARDE(1.1, 100000)',
        '=DOLLARDE(123.456, 2)',
        '=DOLLARDE(1.9, 2)',
        '=DOLLARDE(1.01,10.1)',
      ],
      [
        '=DOLLARDE(-1.01, 8)',
        '=DOLLARDE(-1.0000001, 8.9)',
        '=DOLLARDE(-1.1, 100001)',
        '=DOLLARDE(-1.1, 100000)',
        '=DOLLARDE(-123.456, 2)',
        '=DOLLARDE(-1.9, 2)',
        '=DOLLARDE(-1.01,10.1)',
      ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.0125)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.000000125)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(1.9999900001)
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(1.1)
    expect(engine.getCellValue(adr('E1'))).toBeCloseTo(125.28)
    expect(engine.getCellValue(adr('F1'))).toBeCloseTo(5.5)
    expect(engine.getCellValue(adr('G1'))).toBeCloseTo(1.01)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-1.0125)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(-1.000000125)
    expect(engine.getCellValue(adr('C2'))).toBeCloseTo(-1.9999900001)
    expect(engine.getCellValue(adr('D2'))).toBeCloseTo(-1.1)
    expect(engine.getCellValue(adr('E2'))).toBeCloseTo(-125.28)
    expect(engine.getCellValue(adr('F2'))).toBeCloseTo(-5.5)
    expect(engine.getCellValue(adr('G2'))).toBeCloseTo(-1.01)
  })
})
