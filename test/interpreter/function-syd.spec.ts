import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function SYD', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SYD(1,1,1)', '=SYD(1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SYD(100, 1, 2.1, 2)', '=SYD(100, 1, 2.1, 2.1)', '=SYD(100, 1, 2, 2.1)', '=SYD(100, 1, 2, 2)', ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(33.4562211981567)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(30.4147465437788)
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(33)
  })
})
