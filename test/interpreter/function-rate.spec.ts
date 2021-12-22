import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function RATE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RATE(1,1)', '=RATE(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RATE(12, -100, 400)', ],
      ['=RATE(12, -100, 400, 100, 1)', ],
      ['=RATE(12, -100, 400, 1, 1)', ],
      ['=RATE(12, -100, 400, 0, 1)', ],
      ['=RATE(12, -100, 400, -100, 1)', ],
      ['=RATE(12, -100, 400, 100, 1, -1)', ],
      ['=RATE(0.9, -100, 400)', ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933070977096)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    //inconsistency with product #1 (returns different value)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.499692679085513)
    //inconsistency with product #1 (returns different value)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.99009900990099)
    //inconsistency with product #1 (returns value)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM))
    //inconsistency with product #1 (returns value)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE))
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(-0.8)
  })
})
