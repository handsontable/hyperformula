/**
 * HF-287 — TEXT/numberFormat: thousands grouping, format sections, config
 * separators, and color-tag stripping.
 *
 * Dual-env safe (runs under both Jest and Karma/Jasmine): plain `it()` blocks,
 * `expect().toEqual`/`toBe`, no `it.each`, no `toHaveLength`, no `fs`.
 *
 * Excel oracle values below come from the customer's verified repro table
 * (see HF-287 PLAN/ADR). On HyperFormula's DEFAULT config the grouping glyph is
 * the empty string, so grouping is only *observable* when the instance is
 * configured with a `thousandSeparator` — mirroring HF's config-authoritative
 * model. Config fixtures that set a comma decimal/thousand separator must also
 * override `functionArgSeparator` (defaults to `,`) or the mutual-distinctness
 * conflict check throws at construction.
 */
import {Config} from '../src/Config'
import {DateTimeHelper} from '../src/DateTimeHelper'
import {format} from '../src/format/format'
import {NUMBER_FORMAT_REGEX_SOURCE} from '../src/format/parser'
import {HyperFormula} from '../src'

const cfgDefault = new Config()
// thousandSeparator ',' collides with the default functionArgSeparator ',',
// so functionArgSeparator must move to ';' (Config conflict check).
const cfgComma = new Config({thousandSeparator: ',', functionArgSeparator: ';'})
// space grouping, dot decimal.
const cfgSpace = new Config({thousandSeparator: ' ', functionArgSeparator: ';'})
// space grouping, comma decimal — comma decimal also collides with the default
// comma functionArgSeparator, hence ';'.
const cfgSpaceDecComma = new Config({thousandSeparator: ' ', decimalSeparator: ',', functionArgSeparator: ';'})

const helperDefault = new DateTimeHelper(cfgDefault)
const helperComma = new DateTimeHelper(cfgComma)
const helperSpace = new DateTimeHelper(cfgSpace)
const helperSpaceDecComma = new DateTimeHelper(cfgSpaceDecComma)

describe('HF-287 numberFormat — Excel oracle (verified repro table)', () => {
  it('#,##0.00 with 1234.5 -> 1,234.50 (thousandSeparator ",")', () => {
    expect(format(1234.5, '#,##0.00', cfgComma, helperComma)).toEqual('1,234.50')
  })

  it('#,##0.00;-#,##0.00 with -1234.5 -> -1,234.50 (thousandSeparator ",")', () => {
    expect(format(-1234.5, '#,##0.00;-#,##0.00', cfgComma, helperComma)).toEqual('-1,234.50')
  })

  it('#,##0.00;-#,##0.00 with 1234.5 -> 1,234.50 (positive section)', () => {
    expect(format(1234.5, '#,##0.00;-#,##0.00', cfgComma, helperComma)).toEqual('1,234.50')
  })

  it('#,##0.00 "zł" with 1234.5 -> 1 234.50 zł (thousandSeparator " ", quoted literal stripped)', () => {
    expect(format(1234.5, '#,##0.00 "zł"', cfgSpace, helperSpace)).toEqual('1 234.50 zł')
  })

  it('$#,##0.00;-$#,##0.00 with -1234.5 -> -$1,234.50', () => {
    expect(format(-1234.5, '$#,##0.00;-$#,##0.00', cfgComma, helperComma)).toEqual('-$1,234.50')
  })

  it('000.00 with -5 -> -005.00 (abs padded against placeholders, sign prepended)', () => {
    expect(format(-5, '000.00', cfgDefault, helperDefault)).toEqual('-005.00')
  })
})

describe('HF-287 numberFormat — thousands grouping', () => {
  it('default config emits NO grouping glyph (config-authoritative nuance)', () => {
    expect(format(1234.5, '#,##0.00', cfgDefault, helperDefault)).toEqual('1234.50')
    expect(format(1234567, '#,##0', cfgDefault, helperDefault)).toEqual('1234567')
  })

  it('groups with the configured comma separator', () => {
    expect(format(1234567, '#,##0', cfgComma, helperComma)).toEqual('1,234,567')
    expect(format(1234.5, '#,##0.00', cfgComma, helperComma)).toEqual('1,234.50')
  })

  it('groups with a configured space separator and comma decimal', () => {
    expect(format(1234.5, '#,##0.00', cfgSpaceDecComma, helperSpaceDecComma)).toEqual('1 234,50')
  })

  it('pads to placeholder width first, then groups (0,000 with 5)', () => {
    expect(format(5, '0,000', cfgComma, helperComma)).toEqual('0,005')
    expect(format(5, '0,000', cfgDefault, helperDefault)).toEqual('0005')
  })

  it('grouping skips the extracted sign (negative)', () => {
    expect(format(-12345, '#,##0', cfgComma, helperComma)).toEqual('-12,345')
  })

  it('trailing scaler commas degrade visibly as a literal (never silent mis-scale)', () => {
    // 0,, is Excel "divide by thousands" — OUT of scope; we keep the commas as a
    // literal so the output is recognizably un-scaled rather than plausibly-wrong.
    expect(format(5000000, '0,,', cfgDefault, helperDefault)).toEqual('5000000,,')
  })

  it('interior grouping + trailing scaler keeps grouping and the trailing literal', () => {
    expect(format(1234567, '#,##0,', cfgComma, helperComma)).toEqual('1,234,567,')
  })

  it('does not throw / stays a string for scientific-notation magnitudes', () => {
    // A throw would fail the test outright, so a direct call asserts "no throw".
    const out = format(1e21, '#,##0', cfgComma, helperComma)
    expect(typeof out).toBe('string')
  })
})

describe('HF-287 numberFormat — configured decimal separator', () => {
  it('uses config.decimalSeparator for the decimal point', () => {
    expect(format(12.34, '0.00', cfgSpaceDecComma, helperSpaceDecComma)).toEqual('12,34')
  })

  it('keeps a dot on default config', () => {
    expect(format(12.34, '0.00', cfgDefault, helperDefault)).toEqual('12.34')
  })
})

describe('HF-287 numberFormat — format sections (positive;negative;zero)', () => {
  it('2 sections: negative uses the negative section on abs(value)', () => {
    expect(format(-5, '0.00;(0.00)', cfgDefault, helperDefault)).toEqual('(5.00)')
  })

  it('2 sections: positive uses the positive section', () => {
    expect(format(5, '0.00;(0.00)', cfgDefault, helperDefault)).toEqual('5.00')
  })

  it('2 sections: zero uses the positive section', () => {
    expect(format(0, '0.00;(0.00)', cfgDefault, helperDefault)).toEqual('0.00')
  })

  it('3 sections: zero uses the dedicated zero section', () => {
    expect(format(0, '0.00;(0.00);0.0', cfgDefault, helperDefault)).toEqual('0.0')
  })

  it('3 sections: negative uses the negative section', () => {
    expect(format(-5, '0.00;(0.00);0.0', cfgDefault, helperDefault)).toEqual('(5.00)')
  })

  it('1 section: negative re-adds the leading minus (fixes padLeft-minus bug)', () => {
    // Historically padLeft('-5',3) produced '0-5' -> '0-5.00'. Sign extraction on
    // abs makes it '-005.00'. Mirrors A3 TEXT(12.45,'000.000') -> '012.450'.
    expect(format(-5, '000.00', cfgDefault, helperDefault)).toEqual('-005.00')
  })

  it('1 section: negative with grouping mask -> -5 (Excel #,##0)', () => {
    expect(format(-5, '#,##0', cfgDefault, helperDefault)).toEqual('-5')
    expect(format(-5, '#,##0', cfgComma, helperComma)).toEqual('-5')
  })
})

describe('HF-287 numberFormat — color-tag stripping (pre-dispatch, name-specific)', () => {
  it('strips [Red] from a numeric mask', () => {
    expect(format(1234.5, '[Red]#,##0.00', cfgDefault, helperDefault)).toEqual('1234.50')
    expect(format(1234.5, '[Red]#,##0.00', cfgComma, helperComma)).toEqual('1,234.50')
  })

  it('a color-stripped date mask still renders as a date', () => {
    expect(format(2, '[Red]dd-mm-yyyy', cfgDefault, helperDefault)).toEqual('01-01-1900')
  })

  it('does not touch duration tags [hh]/[mm]', () => {
    // 0.1 day == 2h24m0s
    expect(format(0.1, '[hh]:mm:ss', cfgDefault, helperDefault)).toEqual('02:24:00')
  })
})

describe('HF-287 numberFormat — degradation & fallback (never throw)', () => {
  it('parse-failure returns the cleaned formatArg (preserves format(2,"Foo") -> "Foo")', () => {
    expect(format(2, 'Foo', cfgDefault, helperDefault)).toEqual('Foo')
  })

  it('malformed masks degrade to a string without throwing', () => {
    // A throw would fail the test outright; each direct call asserts "no throw".
    expect(typeof format(1, '[Red', cfgDefault, helperDefault)).toBe('string')
    expect(typeof format(1, '0.00;', cfgDefault, helperDefault)).toBe('string')
    expect(typeof format(1, ';', cfgDefault, helperDefault)).toBe('string')
  })

  it('negative that rounds to zero selects the negative section (raw-sign rule); no throw', () => {
    // Section is selected by the value's RAW sign, before rounding. We do not
    // freeze an Excel oracle value here (Gate B never got a verified repro),
    // only that the raw-sign path is safe and produces a string.
    const out = format(-0.001, '0.00;(0.00)', cfgDefault, helperDefault)
    expect(typeof out).toBe('string')
  })
})

describe('HF-287 numberFormat — existing behavior preserved (regression)', () => {
  it('simple masks unchanged on default config', () => {
    expect(format(1, '###', cfgDefault, helperDefault)).toEqual('1')
    expect(format(12.345, '#.##', cfgDefault, helperDefault)).toEqual('12.35')
    expect(format(1, '000', cfgDefault, helperDefault)).toEqual('001')
    expect(format(1, '00.00', cfgDefault, helperDefault)).toEqual('01.00')
    expect(format(1, '$0.00', cfgDefault, helperDefault)).toEqual('$1.00')
  })
})

describe('HF-287 numberFormat — engine level (TEXT)', () => {
  it('flips the previously-garbage A9 mask $###,##0.00 -> $12.45 (default config)', () => {
    const engine = HyperFormula.buildFromArray([['12.45', '=TEXT(A1, "$###,##0.00")']])
    expect(engine.getCellValue({sheet: 0, col: 1, row: 0})).toEqual('$12.45')
    engine.destroy()
  })

  it('groups with a configured thousandSeparator', () => {
    const engine = HyperFormula.buildFromArray(
      [['1234.5', '=TEXT(A1; "#,##0.00")']],
      {thousandSeparator: ',', functionArgSeparator: ';'}
    )
    expect(engine.getCellValue({sheet: 0, col: 1, row: 0})).toEqual('1,234.50')
    engine.destroy()
  })

  it('applies the negative section', () => {
    const engine = HyperFormula.buildFromArray([['-5', '=TEXT(A1, "0.00;(0.00)")']])
    expect(engine.getCellValue({sheet: 0, col: 1, row: 0})).toEqual('(5.00)')
    engine.destroy()
  })

  it('strips a color tag', () => {
    const engine = HyperFormula.buildFromArray([['1234.5', '=TEXT(A1, "[Red]#,##0.00")']])
    expect(engine.getCellValue({sheet: 0, col: 1, row: 0})).toEqual('1234.50')
    engine.destroy()
  })
})

describe('HF-287 numberFormat — placeholder-less masks/sections render as literals', () => {
  // FINDING 1 (Bugbot): a mask segment with no `#`/`0` placeholder is a
  // literal — the value must NOT be spliced into it.
  it('a comma-only mask is a literal, not a number token', () => {
    expect(format(5, ',', cfgDefault, helperDefault)).toEqual(',')
  })

  it('a mask with a comma but no placeholder is a literal', () => {
    expect(format(1234.5, 'a,b', cfgDefault, helperDefault)).toEqual('a,b')
  })

  it('a plain-text mask keeps working (no regression)', () => {
    expect(format(5, 'abc', cfgDefault, helperDefault)).toEqual('abc')
  })

  // FINDING 2 (Bugbot): a SELECTED section with no placeholder renders that
  // section's literal text (quotes stripped), never the whole format string.
  it('a literal negative section renders just the section text', () => {
    expect(format(-5, '0.00;"neg"', cfgDefault, helperDefault)).toEqual('neg')
  })

  it('an empty negative section renders an empty string', () => {
    expect(format(-5, '0.00;', cfgDefault, helperDefault)).toEqual('')
  })

  it('an empty zero section renders an empty string', () => {
    expect(format(0, '0.00;-0.00;', cfgDefault, helperDefault)).toEqual('')
  })

  it('still formats the positive section for those masks', () => {
    expect(format(5, '0.00;"neg"', cfgDefault, helperDefault)).toEqual('5.00')
    expect(format(5, '0.00;-0.00;', cfgDefault, helperDefault)).toEqual('5.00')
  })
})

describe('HF-287 numberFormat — backslash escape in the section splitter', () => {
  // A backslash escapes the next character so it is NOT treated as a section
  // separator; the escaped pair is carried verbatim through the splitter. Full
  // Excel backslash-unescape at render time is out of scope (the backslash is
  // emitted literally) — these pin the deterministic behavior and the no-throw
  // trailing-backslash case, and exercise the escape branch of splitIntoSections.
  it('keeps an escaped character verbatim without throwing', () => {
    expect(format(1234.5, '#,##0\\x', cfgDefault, helperDefault)).toEqual('1235\\x')
  })

  it('tolerates a trailing backslash with no following character', () => {
    expect(format(5, '0\\', cfgDefault, helperDefault)).toEqual('5\\')
  })

  it('resolves a backslash escape inside a rendered literal section', () => {
    // Negative section is the placeholder-less literal "\x"; renderLiteralSection
    // resolves the escape, so -5 renders "x".
    expect(format(-5, '0.00;\\x', cfgDefault, helperDefault)).toEqual('x')
  })
})

describe('HF-287 numberFormat — ReDoS discipline (white-box regex shape)', () => {
  // Synchronous ReDoS is not catchable by jest/jasmine timeouts (see DEV-2120),
  // so we assert the regex SHAPE stays a flat character class with no nested
  // quantifier such as ([#0]+,)*[#0]+.
  it('number format regex is the flat, non-backtracking form', () => {
    expect(NUMBER_FORMAT_REGEX_SOURCE).toEqual('(\\\\.|[#0,]+(\\.[#0]*)?)')
  })

  it('number format regex contains no nested quantifier', () => {
    // no ")" immediately followed by "*" or "+" (a group being quantified)
    expect(/\)[*+]/.test(NUMBER_FORMAT_REGEX_SOURCE)).toBe(false)
  })
})
