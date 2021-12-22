import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function BITRSHIFT', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(101)'],
      ['=BITRSHIFT(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(1, "foo")'],
      ['=BITRSHIFT("bar", 4)'],
      ['=BITRSHIFT("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for negative value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(-5, -2)'],
      ['=BITRSHIFT(-1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('should work for positive positions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(0, 0)'],
      ['=BITRSHIFT(0, 2)'],
      ['=BITRSHIFT(50, 2)'],
      ['=BITRSHIFT(123, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(12)
    expect(engine.getCellValue(adr('A4'))).toEqual(15)
  })

  it('should work for negative positions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(0, -2)', '=BITLSHIFT(0, 2)'],
      ['=BITRSHIFT(2, -5)', '=BITLSHIFT(2, 5)'],
      ['=BITRSHIFT(123, -2)', '=BITLSHIFT(123, 2)'],
      ['=BITRSHIFT(4786, -3)', '=BITLSHIFT(4786, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(64)
    expect(engine.getCellValue(adr('A3'))).toEqual(492)
    expect(engine.getCellValue(adr('A4'))).toEqual(38288)

    expect(engine.getCellValue(adr('A1'))).toEqual(engine.getCellValue(adr('B1')))
    expect(engine.getCellValue(adr('A2'))).toEqual(engine.getCellValue(adr('B2')))
    expect(engine.getCellValue(adr('A3'))).toEqual(engine.getCellValue(adr('B3')))
    expect(engine.getCellValue(adr('A4'))).toEqual(engine.getCellValue(adr('B4')))
  })

  it('works only for 48 bit results', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(2, -46)'],
      ['=BITRSHIFT(2, -47)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(140737488355328)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.BitshiftLong))
  })

  it('works only for positions from -53 to 53', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BITRSHIFT(0, -54)'],
      ['=BITRSHIFT(0, -53)'],
      ['=BITRSHIFT(0, 53)'],
      ['=BITRSHIFT(0, 54)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
