import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function BITOR', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(101)'],
      ['=BITOR(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(1, "foo")'],
      ['=BITOR("bar", 4)'],
      ['=BITOR("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(1, -2)'],
      ['=BITOR(-1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('should not work for non-integers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(1.2, 2)'],
      ['=BITOR(3.14, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(1, 5)'],
      ['=BITOR(457, 111)'],
      ['=BITOR(BIN2DEC(101), BIN2DEC(1))'],
      ['=BITOR(256, 123)'],
      ['=BITOR(0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5)
    expect(engine.getCellValue(adr('A2'))).toEqual(495)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(379)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
  })

  it('should return numeric type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITOR(1, 5)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })
})
