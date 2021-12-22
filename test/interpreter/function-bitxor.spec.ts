import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function BITXOR', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(101)'],
      ['=BITXOR(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(1, "foo")'],
      ['=BITXOR("bar", 4)'],
      ['=BITXOR("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(1, -2)'],
      ['=BITXOR(-1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('should not work for non-integers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(1.2, 2)'],
      ['=BITXOR(3.14, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(1, 5)'],
      ['=BITXOR(457, 111)'],
      ['=BITXOR(BIN2DEC(101), BIN2DEC(1))'],
      ['=BITXOR(256, 123)'],
      ['=BITXOR(0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(422)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
    expect(engine.getCellValue(adr('A4'))).toEqual(379)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
  })

  it('should return numeric type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITXOR(1, 5)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })
})
