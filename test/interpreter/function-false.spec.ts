import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe("Function FALSE", () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })
})
