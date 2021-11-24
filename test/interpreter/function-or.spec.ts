import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function OR', () => {
  it('usage', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=OR(TRUE())', '=OR(FALSE())', '=OR(FALSE(), TRUE(), FALSE())', '=OR("asdf")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('use coercion #1', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=OR("TRUE", 0)'],
      ['=OR("foo", 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('use coercion #2', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=OR(A4:B4)'],
      ['=OR(C4:D4)'],
      ['=OR(C4:D4, "foo")'],
      ['TRUE', 1, 'foo', '=TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('function OR with numerical arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=OR(1)', '=OR(0)', '=OR(FALSE(), 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('function OR takes at least one argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=OR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('if error in range found, returns first one in row-by-row order', async() => {
const engine = await HyperFormula.buildFromArray([
      ['0', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['0', '0'],
      ['0', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('is computed eagerly', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['0', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
