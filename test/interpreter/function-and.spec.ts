import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function AND', () => {
  it('usage', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AND(TRUE(), TRUE())', '=AND(TRUE(), FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })

  it('with numerical arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AND(1)', '=AND(0)', '=AND(1, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('use coercion #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AND("TRUE", 1)'],
      ['=AND("foo", TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('use coercion #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AND(A4:B4)'],
      ['=AND(C4:D4)'],
      ['=AND(C4:D4, "foo")'],
      ['TRUE', 1, 'foo', '=TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('if error in range found, returns first one in row-by-row order', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=AND(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=AND(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('takes at least one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AND()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('is computed eagerly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '=4/0'],
      ['1', '1'],
      ['=AND(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
