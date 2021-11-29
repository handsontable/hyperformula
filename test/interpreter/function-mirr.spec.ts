import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MIRR', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MIRR(1,1)'],
      ['=MIRR(1,1,1,1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return correct value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MIRR(B1:F1,0.3,-0.1)', 1, 2, -3, -5, 8],
      ['=MIRR(B2:C2,1,1)', -1, 1],
      ['=MIRR(B3:E3,0.2,0.1)', -1, 0, -1, 1],
      ['=MIRR(B4:D4,0.2,0.1)', -1, -1, 1],
      ['=MIRR(B5:D5, -2, 1)', 3, 4, -3]
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.257018945686308, 6)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.161201673643132, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(-0.261451054124004, 6) // different value without 0
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(1.58198889747161, 6)
  })

  it('should return #DIV/0! if "contains at least one positive and one negative value" condition is not met', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MIRR(B1:E1,0.2,0.1)', -1, 0, -1, -1],
      ['=MIRR(B2:E2,0.2,0.1)', 1, 0, 1, 1],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return #DIV/0! if any rate is -1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MIRR(B1:E1,-1,0.1)', -1, 1, -1, -1],
      ['=MIRR(B2:E2,0.2,-1)', 1, -1, 1, 1],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should ignore text, boolean and empty values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MIRR(B1:H1,0.2,0.1)', -1, 0, 'abcd', true, null, -1, 1],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.161201673643132, 6)
  })
})
