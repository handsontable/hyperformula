import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function EVEN', () => {
  it('number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=EVEN()', '=EVEN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for positive numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=EVEN(0.3)', '=EVEN(1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
    expect(engine.getCellValue(adr('B1'))).toBe(2)
  })

  it('works for negative numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=EVEN(-0.3)', '=EVEN(-1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-2)
    expect(engine.getCellValue(adr('B1'))).toBe(-2)
  })

  it('use coercion', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=EVEN("42.3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(44)
  })

  it('propagates error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=4/0'],
      ['=EVEN(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
