import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function STANDARDIZE', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STANDARDIZE(1, 2)'],
      ['=STANDARDIZE(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STANDARDIZE("foo", 1, 2)'],
      ['=STANDARDIZE(1, "foo", 2)'],
      ['=STANDARDIZE(1, 2, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STANDARDIZE(1, 2, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-0.25)
  })

  it('should check bounds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STANDARDIZE(1, 2, 0.001)'],
      ['=STANDARDIZE(1, 2, 0)'],
      ['=STANDARDIZE(1, 2, -0.001)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-1000)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
