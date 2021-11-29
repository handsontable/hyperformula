import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOGNORM.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.INV(1, 2)'],
      ['=LOGNORM.INV(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.INV("foo", 2, 3)'],
      ['=LOGNORM.INV(0.5, "baz", 3)'],
      ['=LOGNORM.INV(0.5, 2, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.INV(0.1, 1, 2)'],
      ['=LOGNORM.INV(0.5, 2, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.209485002124057, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(7.38905609893065, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.INV(0.01, 0, 0.01)'],
      ['=LOGNORM.INV(0, 0, 0.01)'],
      ['=LOGNORM.INV(0.01, 0, 0)'],
      ['=LOGNORM.INV(0.99, 0, 0.01)'],
      ['=LOGNORM.INV(1, 0, 0.01)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.977005029803317, 6)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1.0235361840474, 6)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
