import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BETA.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BETA.INV(1, 2)'],
      ['=BETA.INV(1, 2, 3, 4, 5, 6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BETA.INV("foo", 2, 3)'],
      ['=BETA.INV(1, "baz", 3)'],
      ['=BETA.INV(1, 2, "baz")'],
      ['=BETA.INV(1, 2, 3, "a", 2)'],
      ['=BETA.INV(1, 2, 3, 1, "b")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BETA.INV(0.1, 1, 2)'],
      ['=BETA.INV(0.5, 2, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0513167019494862, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.313810170455698, 6)
  })

  it('scaling works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BETA.INV(0.1, 1, 2, 2, 10)'],
      ['=BETA.INV(0.5, 2, 4, -1, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.41053361559589, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.686189829544302, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BETA.INV(0, 1, 1)'],
      ['=BETA.INV(0.5, 0, 1)'],
      ['=BETA.INV(0.5, 1, 0)'],
      ['=BETA.INV(1, 1, 1)'],
      ['=BETA.INV(1.0001, 1, 1)'],
      ['=BETA.INV(0.6, 1, 1, 0.7, 0.6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqual(1) //product #2 returns NUM
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WrongOrder))
  })
})
