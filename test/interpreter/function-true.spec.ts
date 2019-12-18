import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function TRUE', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })
})
