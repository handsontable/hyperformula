import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function INDEX', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX()'],
      ['=INDEX(B1:D3, 1, 1, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('requires 2nd and 3rd arguments to be integers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:B1, "foo", 1)'],
      ['=INDEX(B1:B1, 1, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('requires 2nd argument to be in bounds of range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:D3, -1, 1)'],
      ['=INDEX(B1:D3, 4, 1)'],
      ['=INDEX(42, -1, 1)'],
      ['=INDEX(42, 2, 1)'],
      ['=INDEX(B1, -1, 1)'],
      ['=INDEX(B1, 2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('requires 2nd and 3rd arguments to be in bounds of range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:D3, 1, -1)'],
      ['=INDEX(B1:D3, 1, 4)'],
      ['=INDEX(42, 1, -1)'],
      ['=INDEX(42, 1, 2)'],
      ['=INDEX(B1, 1, -1)'],
      ['=INDEX(B1, 1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('works for range and nonzero arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:C2, 1, 1)', '1', '2'],
      ['=INDEX(B1:C2, 1, 2)', '3', '4'],
      ['=INDEX(B1:C2, 2, 1)'],
      ['=INDEX(B1:C2, 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should propagate errors properly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:C3, 1, 1/0)'],
      ['=INDEX(NA(), 1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('should return VALUE error when one of the cooridnate is 0 or null', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INDEX(B1:D5, 0, 2)'],
      ['=INDEX(B1:D5, 2, 0)'],
      ['=INDEX(B1:D5,,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('should work for scalars too', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo'],
      ['=INDEX(A1, 1, 1)'],
      ['=INDEX(42, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('foo')
    expect(engine.getCellValue(adr('A3'))).toEqual(42)
  })

  it('should assume first column if no last argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=INDEX(A1:B2, 2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })
})
