import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MULTINOMIAL', () => {
  it('checks required number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('computes correct answer for two args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(6,8)', '=MULTINOMIAL(0,0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3003)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('computes correct answer for more than two args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(2,3,5,7)', '=MULTINOMIAL(10,11,12,13,14)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(49008960)
    expect(engine.getCellValue(adr('B1')) as number / 2.20917676017678e+38).toBeCloseTo(1, 6)
  })

  it('accepts single arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(1000)', '=MULTINOMIAL(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('coerces to number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL("2",4)'],
      ['=MULTINOMIAL(B2:C2)', '\'2', 4],
      ['=MULTINOMIAL(TRUE(),4)'],
      ['=MULTINOMIAL(B4:C4)', true, 4],
      ['=MULTINOMIAL(,4)'],
      ['=MULTINOMIAL(B6:C6)', null, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(15)
    expect(engine.getCellValue(adr('A2'))).toBe(15)
    expect(engine.getCellValue(adr('A3'))).toBe(5)
    expect(engine.getCellValue(adr('A4'))).toBe(5)
    expect(engine.getCellValue(adr('A5'))).toBe(1)
    expect(engine.getCellValue(adr('A6'))).toBe(1)
  })

  it('throws error for non-coercible values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(B1:C1)', 'abcd', 4],
      ['=MULTINOMIAL("abcd",4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(-1,5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('truncates numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(B1:C1)', 5.5, 10.9],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3003)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MULTINOMIAL(NA(),4)'],
      ['=MULTINOMIAL(B2:C2)', '=NA()', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
  })
})
