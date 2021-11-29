import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FALSE', () => {
  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([['=FALSE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('is 0-arity', () => {
    const [engine] = HyperFormula.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
