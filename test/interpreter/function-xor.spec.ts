import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function XOR', () => {
  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR(TRUE(), TRUE())'],
      ['=XOR(TRUE(), FALSE())'],
      ['=XOR(FALSE(), TRUE())'],
      ['=XOR(FALSE(), FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
  })

  it('at least one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('for one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR(TRUE())'],
      ['=XOR(FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
  })

  it('use coercion #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR("TRUE")'],
      ['=XOR(1)'],
      ['=XOR(1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('use coercion #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR(A4:B4)'],
      ['=XOR(C4:D4)'],
      ['=XOR(C4:D4, "foo")'],
      ['TRUE', 1, 'foo', '=TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('when no coercible to number arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('returns TRUE iff odd number of TRUEs present', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=XOR(TRUE(), TRUE(), TRUE())'],
      ['=XOR(TRUE(), TRUE(), TRUE(), TRUE())'],
      ['=XOR(TRUE(), TRUE(), TRUE(), TRUE(), TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
  })

  it('if error in range found, returns first one in row-by-row order', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=XOR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '0'],
      ['0', '1'],
      ['=XOR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('is computed eagerly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['0', '1'],
      ['=XOR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
