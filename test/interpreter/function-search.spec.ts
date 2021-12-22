import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SEARCH', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH()'],
      ['=SEARCH("foo")'],
      ['=SEARCH("foo", 1, 2, 3)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return VALUE when wrong type of third parameter', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH("foo", "bar", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return VALUE if third parameter is not between 1 and text length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH("foo", "bar", 0)'],
      ['=SEARCH("foo", "bar", -1)'],
      ['=SEARCH("foo", "bar", 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LengthBounds))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LengthBounds))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LengthBounds))
  })

  it('should work with simple strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH("f", "foo")'],
      ['=SEARCH("o", "foo")'],
      ['=SEARCH("o", "foo", 3)'],
      ['=SEARCH("g", "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
  })

  it('should work with wildcards', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH("*f", "foobarbaz")'],
      ['=SEARCH("b*b", "foobarbaz")'],
      ['=SEARCH("b?z", "foobarbaz")'],
      ['=SEARCH("b?b", "foobarbaz")'],
      ['=SEARCH("?b", "foobarbaz", 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(7)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
    expect(engine.getCellValue(adr('A5'))).toEqual(6)
  })

  it('should work with regular expressions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH(".*f", "foobarbaz")'],
      ['=SEARCH("b.*b", "foobarbaz")'],
      ['=SEARCH("b.z", "foobarbaz")'],
      ['=SEARCH("b.b", "foobarbaz")'],
      ['=SEARCH(".b", "foobarbaz", 5)'],
    ], {useRegularExpressions: true})

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(7)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
    expect(engine.getCellValue(adr('A5'))).toEqual(6)
  })

  it('should be case insensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH("R", "bar")'],
      ['=SEARCH("r", "baR")'],
      ['=SEARCH("?R", "bar")'],
      ['=SEARCH("*r", "baR")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SEARCH(1, 1, 1)'],
      ['=SEARCH(0, 5+5)'],
      ['=SEARCH("U", TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })
})
