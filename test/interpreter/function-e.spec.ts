import {buildConfig, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function E', () => {
  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=E(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })
  it('should return E with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=E()'],
    ], buildConfig({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toEqual(2.71828182845905)
  })
})

