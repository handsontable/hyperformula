import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NORM.S.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.INV()'],
      ['=NORM.S.INV(3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.INV("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.INV(0.9)'],
      ['=NORM.S.INV(0.5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.2815515655446, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.INV(0.01)'],
      ['=NORM.S.INV(0)'],
      ['=NORM.S.INV(0.99)'],
      ['=NORM.S.INV(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-2.32634787404084, 6)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2.32634787404084, 6)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
