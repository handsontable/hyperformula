import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function EXACT', () => {
  it('should take two arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT("foo")'],
      ['=EXACT("foo", "bar", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should compare strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT(B1, C1)', '', ''],
      ['=EXACT(B2, C2)', 'foo', 'foo'],
      ['=EXACT(B3, C3)', 'foo', 'fo'],
      ['=EXACT(B4, C4)', 'foo', 'bar'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(false)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
  })

  it('should be case/accent sensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT(B1, C1)', 'foo', 'FOO'],
      ['=EXACT(B2, C2)', 'foo', 'fóó'],
    ], {caseSensitive: false})

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
  })

  it('should be case sensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT(B1, C1)', 'foo', 'Foo'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
  })

  it('should coerce', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT(,)'],
      ['=EXACT(B2, "0")', 0],
      ['=EXACT(B3, "")', null],
      ['=EXACT(B4, "TRUE")', '=TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
    expect(engine.getCellValue(adr('A4'))).toBe(true)
  })

  it('should return error for range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=EXACT("foo",B1:C1)'],
      ['=EXACT(B1:C1,"foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
