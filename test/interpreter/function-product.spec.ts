import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PRODUCT', () => {
  it('should take at least one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PRODUCT()']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate product', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PRODUCT(2, 3)'],
      ['=PRODUCT(B2:D2, E2, F2)', 2, 3, 'foo', 'bar', 4],
      ['=PRODUCT(5, "foo")']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(24)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })
})
