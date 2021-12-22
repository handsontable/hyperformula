import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function RRI', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RRI(1,1)', '=RRI(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RRI(1, 2, 1)', '=RRI(2, 1, 2)', '=RRI(0.1, 2, 1)'],
      ['=RRI(1, -1, -1)', '=RRI(1, -1, 1)', '=RRI(1, 1, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-0.5)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.414213562373095)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-0.9990234375)
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.NUM))
  })
})
