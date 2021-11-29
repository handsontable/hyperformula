import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function F.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.INV(1, 2)'],
      ['=F.INV(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.INV("foo", 2, 3)'],
      ['=F.INV(1, "baz", 3)'],
      ['=F.INV(1, 2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.INV(0.1, 1, 1)'],
      ['=F.INV(0.9, 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0250856309369253, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(9, 6)
  })

  it('truncates second and third arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.INV(0.1, 1.9, 1)'],
      ['=F.INV(0.9, 2, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0250856309369253, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(9, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.INV(0.5, 0.999, 1)'],
      ['=F.INV(0.5, 1, 0.999)'],
      ['=F.INV(-0.0001, 2, 1)'],
      ['=F.INV(1.0001, 2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
