import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LEN', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEN()'],
      ['=LEN("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEN("foo")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEN(1)'],
      ['=LEN(5+5)'],
      ['=LEN(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
  })
})
