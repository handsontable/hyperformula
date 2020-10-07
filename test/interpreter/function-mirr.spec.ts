import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MIRR', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MIRR(1,1)'],
      ['=MIRR(1,1,1,1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MIRR(B1:C1,1,1)',1,-1],
      ['=MIRR(B2:C2,1,1)',-1,1],
      ['=MIRR(B3:E3,0.2,0.1)',-1,0,-1,1],
      ['=MIRR(B4:E4,0.2,0.1)',-1,0,-1,-1],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.161201673643132,6)
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
