import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DOLLARFR', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DOLLARFR(1)', '=DOLLARFR(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('div/0 when second argument too small', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DOLLARFR(1,0)', '=DOLLARFR(1, 0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      [
        '=DOLLARFR(1.0125, 8)',
        '=DOLLARFR(1.000000125, 8.9)',
        '=DOLLARFR(1.9999900001, 100001)',
        '=DOLLARFR(1.1, 100000)',
        '=DOLLARFR(125.28, 2)',
        '=DOLLARFR(5.5, 2)',
        '=DOLLARFR(1.01,10.1)',
      ],
      [
        '=DOLLARFR(-1.0125, 8)',
        '=DOLLARFR(-1.000000125, 8.9)',
        '=DOLLARFR(-1.9999900001, 100001)',
        '=DOLLARFR(-1.1, 100000)',
        '=DOLLARFR(-125.28, 2)',
        '=DOLLARFR(-5.5, 2)',
        '=DOLLARFR(-1.01,10.1)',
      ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.01)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.0000001)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(1.1)
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(1.1)
    expect(engine.getCellValue(adr('E1'))).toBeCloseTo(125.056)
    expect(engine.getCellValue(adr('F1'))).toBeCloseTo(5.1)
    expect(engine.getCellValue(adr('G1'))).toBeCloseTo(1.01)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-1.01)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(-1.0000001)
    expect(engine.getCellValue(adr('C2'))).toBeCloseTo(-1.1)
    expect(engine.getCellValue(adr('D2'))).toBeCloseTo(-1.1)
    expect(engine.getCellValue(adr('E2'))).toBeCloseTo(-125.056)
    expect(engine.getCellValue(adr('F2'))).toBeCloseTo(-5.1)
    expect(engine.getCellValue(adr('G2'))).toBeCloseTo(-1.01)
  })
})
