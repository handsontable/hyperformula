import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function DDB', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DDB(1,1,1)', '=DDB(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DDB(10000,50,10,2,1)',
        '=DDB(10000,50,10,2)',
        '=DDB(10000,50,10,2,1.2)',
        '=DDB(10000,50,10,2,2.5)',
        '=DDB(10000,10010,10,2,2.5)',
      ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(900)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1600)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(1056)
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(1875)
    expect(engine.getCellValue(adr('E1'))).toBeCloseTo(0)
  })

})
