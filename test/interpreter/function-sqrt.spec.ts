import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SQRT', () => {
  it('should return error for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SQRT(-2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.Infinity))
  })

  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SQRT()'],
      ['=SQRT(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SQRT("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SQRT(0)'],
      ['=SQRT(16)'],
      ['=SQRT(2)'],
    ], { smartRounding : false})

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(1.4142135623730951)
  })
})
