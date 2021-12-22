import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FIND', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND()'],
      ['=FIND("foo")'],
      ['=FIND("foo", 1, 2, 3)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return VALUE when wrong type of third parameter', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND("foo", "bar", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return VALUE if third parameter is not between 1 and text length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND("foo", "bar", 0)'],
      ['=FIND("foo", "bar", -1)'],
      ['=FIND("foo", "bar", 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND("f", "foo")'],
      ['=FIND("o", "foo")'],
      ['=FIND("o", "foo", 3)'],
      ['=FIND("g", "foo")'],
      ['=FIND("?o", "?o")'],
      ['=FIND("?o", "oo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
  })

  it('should be case sensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND("R", "bar")'],
      ['=FIND("r", "bar")'],
      ['=FIND("r", "baR")'],
      ['=FIND("R", "baR")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.PatternNotFound))
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FIND(1, 1, 1)'],
      ['=FIND(0, 5+5)'],
      ['=FIND("U", TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })
})
