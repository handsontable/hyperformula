import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TRUE', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('is 0-arity', async() => {
const engine = await HyperFormula.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
