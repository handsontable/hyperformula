import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CHISQ.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.INV(1)'],
      ['=CHISQ.INV(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.INV("foo", 2)'],
      ['=CHISQ.INV(1, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.INV(0.1, 1)'],
      ['=CHISQ.INV(0.9, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0157907740934326, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(4.60517018598809, 6)
  })

  it('truncates second arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.INV(0.1, 1.9)'],
      ['=CHISQ.INV(0.9, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0157907740934326, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(4.60517018598809, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.INV(0.5, 0.999)'],
      ['=CHISQ.INV(-0.0001, 2)'],
      ['=CHISQ.INV(1.0001, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
