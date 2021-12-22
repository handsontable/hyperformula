import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function QUOTIENT', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=QUOTIENT(101)'],
      ['=QUOTIENT(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=QUOTIENT(1, "foo")'],
      ['=QUOTIENT("bar", 4)'],
      ['=QUOTIENT("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return error when dividing by 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=QUOTIENT(42, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=QUOTIENT(5, 2)'],
      ['=QUOTIENT(36, 6.1)'],
      ['=QUOTIENT(10.5, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('should work for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=QUOTIENT(-5, 2)'],
      ['=QUOTIENT(5, -2)'],
      ['=QUOTIENT(-5, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-2)
    expect(engine.getCellValue(adr('A2'))).toEqual(-2)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })
})
