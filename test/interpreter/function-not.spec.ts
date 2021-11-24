import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NOT', () => {
  it('number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NOT()', '=NOT(TRUE(), TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NOT(TRUE())', '=NOT(FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
  })

  it('use coercion', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NOT("FALSE")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
  })

  it('propagates error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=4/0'],
      ['=NOT(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
