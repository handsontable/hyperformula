import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DDB', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DDB(1,1,1)', '=DDB(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DDB(10000,50,10,2,1)',
        '=DDB(10000,50,10,2)',
        '=DDB(10000,50,10,2,1.2)',
        '=DDB(10000,50,10,2,2.5)',
        '=DDB(10000,10010,10,2,2.5)',
        '=DDB(2,1,20,10,60)',
      ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(900)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1600)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(1056)
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(1875)
    expect(engine.getCellValue(adr('E1'))).toBeCloseTo(0)
    expect(engine.getCellValue(adr('F1'))).toBeCloseTo(0)
  })

  it('should return correct value for fractional period', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DDB(10000,50,10,2.5,1)',
        '=DDB(10000,50,10,2.1)',
        '=DDB(10000,50,10,2.9,1.2)',
        '=DDB(10000,50,10,2.5,2.5)',
        '=DDB(10000,10010,10,2.1,2.5)',
        '=DDB(2,1,20,10.9,60)',
      ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(853.8149682, 6)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1564.69243, 6)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(941.2355527, 6)
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(1623.797632, 6)
    expect(engine.getCellValue(adr('E1'))).toBeCloseTo(0)
    expect(engine.getCellValue(adr('F1'))).toBeCloseTo(0)
  })
})
