import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SUBSTITUTE', () => {
  it('should take three or four parameters', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo", "f")'],
      ['=SUBSTITUTE("foobar", "o", "uu", 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should substitute new text for all occurrences of old text in a string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo", "f", "bb")'],
      ['=SUBSTITUTE("foobar", "o", "uu")'],
      ['=SUBSTITUTE("fooobar", "oo", "x")']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('bboo')
    expect(engine.getCellValue(adr('A2'))).toBe('fuuuubar')
    expect(engine.getCellValue(adr('A3'))).toBe('fxobar')
  })

  it('should substitute new text for nth occurrence of a string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", 1)'],
      ['=SUBSTITUTE("foobar", "o", "OO", 2)'],
      ['=SUBSTITUTE("foobar", "o", "OO", 3)'],
      ['=SUBSTITUTE("fofofofofo", "o", "u", 4)']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('ffobar')
    expect(engine.getCellValue(adr('A2'))).toBe('foOObar')
    expect(engine.getCellValue(adr('A3'))).toBe('foobar')
    expect(engine.getCellValue(adr('A4'))).toBe('fofofofufo')
  })

  it('should return the original text if there are not enough occurrences of the search string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "BAZ", 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('foobar')
  })

  it('should accept "." character in the search string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo.bar", ".", "BAZ")'],
      ['=SUBSTITUTE("foo.bar", "foo.", "BAZ")'],
      ['=SUBSTITUTE("foo.bar", ".bar", "BAZ")'],
      ['=SUBSTITUTE("foo.foo.foo.bar.", ".", "BAZ", 1)'],
      ['=SUBSTITUTE("foo.foo.foo.bar.", ".", "BAZ", 2)'],
      ['=SUBSTITUTE("foo.foo.foo.bar.", ".", "BAZ", 3)'],
      ['=SUBSTITUTE("foo.foo.foo.bar.", ".", "BAZ", 4)'],
      ['=SUBSTITUTE("foo.foo.foo.bar.", ".", "BAZ", 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A2'))).toBe('BAZbar')
    expect(engine.getCellValue(adr('A3'))).toBe('fooBAZ')
    expect(engine.getCellValue(adr('A4'))).toBe('fooBAZfoo.foo.bar.')
    expect(engine.getCellValue(adr('A5'))).toBe('foo.fooBAZfoo.bar.')
    expect(engine.getCellValue(adr('A6'))).toBe('foo.foo.fooBAZbar.')
    expect(engine.getCellValue(adr('A7'))).toBe('foo.foo.foo.barBAZ')
    expect(engine.getCellValue(adr('A8'))).toBe('foo.foo.foo.bar.')
  })

  it('should accept regexp special characters in the search string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo[bar", "[", "BAZ")'],
      ['=SUBSTITUTE("foo]bar", "]", "BAZ")'],
      ['=SUBSTITUTE("foo-bar", "-", "BAZ")'],
      ['=SUBSTITUTE("foo*bar", "*", "BAZ")'],
      ['=SUBSTITUTE("foo+bar", "+", "BAZ")'],
      ['=SUBSTITUTE("foo?bar", "?", "BAZ")'],
      ['=SUBSTITUTE("foo^bar", "^", "BAZ")'],
      ['=SUBSTITUTE("foo$bar", "$", "BAZ")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A2'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A3'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A4'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A5'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A6'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A7'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A8'))).toBe('fooBAZbar')
  })

  it('should work with search strings that look like regular expressions', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo.*bar", ".*", "BAZ")'],
      ['=SUBSTITUTE("foo[a-z]+bar", "[a-z]+", "BAZ")'],
      ['=SUBSTITUTE("foo[^-]bar", "[^-]", "BAZ")'],
      ['=SUBSTITUTE("foo[^*]bar", "[^*]", "BAZ")'],
      ['=SUBSTITUTE("foo/.*/bar", "/.*/", "BAZ")'],
      ['=SUBSTITUTE("foo\\sbar", "\\s", "BAZ")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A2'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A3'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A4'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A5'))).toBe('fooBAZbar')
    expect(engine.getCellValue(adr('A6'))).toBe('fooBAZbar')
  })

  it('should coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", TRUE(), 1)'],
      ['=SUBSTITUTE("fooTRUE", TRUE(), 5, 1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fTRUEobar')
    expect(engine.getCellValue(adr('A2'))).toBe('foo5')
  })

  it('should return value when last argument is less than one', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", 0)'],
      ['=SUBSTITUTE("foobar", "o", "OO", -1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('should return value when arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", "bar")'],
      ['=SUBSTITUTE(B1:C1, "o", "f", 3)'],
      ['=SUBSTITUTE("foobar", B1:C1, "f", 3)'],
      ['=SUBSTITUTE("foobar", "o", B1:C1, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
