import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function DB', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DB(1,1,1)', '=DB(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DB(10000,50,10,2,12)',
        '=DB(10000,50,10,2)',
        '=DB(10000,50,10,2,7)'],
      ['=DB(10000,50,10,1,12)',
        '=DB(10000,50,10,1,7)'],
      ['=DB(10000,50,10,10,12)',
        '=DB(10000,50,10,10,7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2420.79)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(2420.79)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(3124.63)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(4110.00)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(2397.50)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(35.07)
    expect(engine.getCellValue(adr('B3'))).toBeCloseTo(45.26)
  })

  it('compatability', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DB(1000000,100000,6,7,7)',
        '=DB(1000000,100000,6,8,7)',
        '=DB(1000000,100000,6,7)', ],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(15845.10)
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NUM))

  })
})
