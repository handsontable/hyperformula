import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function TRUE', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })
})
