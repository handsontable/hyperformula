import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TBILLEQ', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TBILLEQ(1,1)', '=TBILLEQ(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TBILLEQ(0, 100, 0.1)'],
      ['=TBILLEQ(0, 360, 0.1)', '=TBILLEQ(0, 183, 0.1)', ],
      ['=TBILLEQ(0, 180, 1.9)', '=TBILLEQ(0, 180, 2)', '=TBILLEQ(0, 180, 2.1)', ],
      ['=TBILLEQ("1/2/2000", "31/1/2001", 0.1)', '=TBILLEQ(0, 365, 0.1)', ],
      ['=TBILLEQ("28/2/2003", "29/2/2004", 0.1)'],
      ['=TBILLEQ(2, 2.1, 0.1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.104285714285714, 6)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    //inconsistency with products #1 & #2
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.112654320987654, 6)
    //inconsistency with products #1 & #2
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(0.106818846941762, 6)
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(38.5277777777778, 6)
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('C3'))).toEqualError(detailedError(ErrorType.NUM))
    //inconsistency with products #1 & #2
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.112828438948995, 6)
    //inconsistency with products #1 & #2
    expect(engine.getCellValue(adr('B4'))).toBeCloseTo(0.112828438948995, 6)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM))
  })
})
