import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {DetailedCellError} from '../src/CellValue'

/**
 * HF-361: an empty string ('') must not be silently coerced to 0.
 *
 * Excel treats '' as ordinary text: it is not a valid number, so arithmetic on it fails with
 * #VALUE! and COUNT (which only counts numbers) does not count it. HyperFormula used to special-case
 * '' to 0 inside ArithmeticHelper#coerceNonDateScalarToMaybeNumber, which is a different code path
 * from a genuinely blank cell (`EmptyValue`, governed separately by `evaluateNullToZero`).
 */
describe('HF-361: empty string is not coerced to 0', () => {
  it('COUNT of a literal empty string does not count it as numeric', () => {
    const hf = HyperFormula.buildFromArray([['=COUNT("")']], {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue({sheet: 0, col: 0, row: 0})).toBe(0)

    hf.destroy()
  })

  it('COUNT of a cell holding an empty string (via ="") does not count it as numeric', () => {
    const hf = HyperFormula.buildFromArray([['=""', '=COUNT(A1)']], {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(0)

    hf.destroy()
  })

  it('COUNT of a cell holding a raw empty string (a text cell, not a blank one) does not count it', () => {
    const hf = HyperFormula.buildFromArray([['', '=COUNT(A1)']], {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(0)

    hf.destroy()
  })

  it('adding a literal empty string to a number is #VALUE!, matching Excel', () => {
    const hf = HyperFormula.buildFromArray([['=""+0']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('adding a number to an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=""+1']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('subtracting a number from an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=""-1']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('multiplying an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=""*1']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('dividing an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=""/1']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('negating an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=-""']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('raising a number to the power of an empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=1^""']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('a text cell holding an empty string behaves the same as the literal in arithmetic', () => {
    const hf = HyperFormula.buildFromArray([['', '=A1+0']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 1, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('SUM of a literal empty string is #VALUE!, consistent with other non-numeric text', () => {
    const hf = HyperFormula.buildFromArray([['=SUM("")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('AVERAGE of a literal empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=AVERAGE("")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('PRODUCT of a literal empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=PRODUCT("")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('MIN of a literal empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=MIN("")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('MAX of a literal empty string is #VALUE!', () => {
    const hf = HyperFormula.buildFromArray([['=MAX("")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('SUM of other non-numeric literal text is #VALUE! too (baseline, unaffected by this fix)', () => {
    const hf = HyperFormula.buildFromArray([['=SUM("abc")']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('ROUND rejects a literal empty string for its NUMBER-typed argument', () => {
    const hf = HyperFormula.buildFromArray([['=ROUND("",1)']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })

  it('POWER rejects a literal empty string for its NUMBER-typed argument', () => {
    const hf = HyperFormula.buildFromArray([['=POWER("",2)']], {licenseKey: 'gpl-v3'})

    const result = hf.getCellValue({sheet: 0, col: 0, row: 0}) as DetailedCellError

    expect(result.type).toBe(ErrorType.VALUE)

    hf.destroy()
  })
})

describe('HF-361: unaffected — blank cells (EmptyValue) keep their existing behavior', () => {
  it('a truly blank cell still coerces to 0 in arithmetic (evaluateNullToZero: false)', () => {
    const hf = HyperFormula.buildFromArray([[null, '=A1+1']], {licenseKey: 'gpl-v3', evaluateNullToZero: false})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(1)

    hf.destroy()
  })

  it('a truly blank cell still coerces to 0 in arithmetic (evaluateNullToZero: true)', () => {
    const hf = HyperFormula.buildFromArray([[null, '=A1+1']], {licenseKey: 'gpl-v3', evaluateNullToZero: true})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(1)

    hf.destroy()
  })

  it('COUNT of a truly blank cell is still 0 (evaluateNullToZero: false)', () => {
    const hf = HyperFormula.buildFromArray([[null, '=COUNT(A1)']], {licenseKey: 'gpl-v3', evaluateNullToZero: false})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(0)

    hf.destroy()
  })

  it('COUNT of a truly blank cell is still 0 (evaluateNullToZero: true)', () => {
    const hf = HyperFormula.buildFromArray([[null, '=COUNT(A1)']], {licenseKey: 'gpl-v3', evaluateNullToZero: true})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(0)

    hf.destroy()
  })

  it('evaluateNullToZero: false leaves a formula that evaluates to EmptyValue as null', () => {
    const hf = HyperFormula.buildFromArray([[null, '=A1']], {licenseKey: 'gpl-v3', evaluateNullToZero: false})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBeNull()

    hf.destroy()
  })

  it('evaluateNullToZero: true turns a formula that evaluates to EmptyValue into 0', () => {
    const hf = HyperFormula.buildFromArray([[null, '=A1']], {licenseKey: 'gpl-v3', evaluateNullToZero: true})

    expect(hf.getCellValue({sheet: 0, col: 1, row: 0})).toBe(0)

    hf.destroy()
  })

  it('a "" COUNTIF criterion still matches only genuinely blank cells, not text cells holding ""', () => {
    const hf = HyperFormula.buildFromArray([
      [1, null, ''],
      ['=COUNTIF(A1:C1, "")'],
    ], {licenseKey: 'gpl-v3'})

    // Criterion.ts resolves a '' criterion to `cellValue === EmptyValue` *before* any numeric
    // coercion happens, so it never went through the coerceNonDateScalarToMaybeNumber bug and
    // this behavior (blank matches, a text "" cell does not) is unchanged by this fix.
    expect(hf.getCellValue({sheet: 0, col: 0, row: 1})).toBe(1)

    hf.destroy()
  })
})
