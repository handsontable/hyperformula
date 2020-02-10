import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Unary operator MINUS', () => {
  it('works for obvious case', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-3)
  })

  it('use number coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-"3"'],
      ['=-"foobar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-3)
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('pass error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-B1', '=FOOBAR()'],
      ['=-B2', '=1/0'],

    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['9', '=-A1:A3'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
