import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function GCD', () => {
  it('checks required number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('computes correct answer for two args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(2*3*5,3*5*7)', '=GCD(0,1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3 * 5)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('computes correct answer for more than two args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(2*3*5,3*5*7, 2*5*7)', '=GCD(100,101,102,103,104)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('works with zeroes', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(2*3*5,3*5*7, 2*5*7, 0, 0, 0)', '=GCD(0, 0, 100,101,102,103,104, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('accepts single arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(1)', '=GCD(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(0)
  })

  it('coerces to number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD("2",4)'],
      ['=GCD(B2:C2)', '\'2', 4],
      ['=GCD(TRUE(),4)'],
      ['=GCD(B4:C4)', true, 4],
      ['=GCD(,4)'],
      ['=GCD(B6:C6)', null, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(1)
    expect(engine.getCellValue(adr('A4'))).toBe(1)
    expect(engine.getCellValue(adr('A5'))).toBe(4)
    expect(engine.getCellValue(adr('A6'))).toBe(4)
  })

  it('ignores non-coercible values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(B1:C1)', 'abcd', 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(4)
  })

  it('throws error for non-coercible values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD("abcd",4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('handles overflow', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(1000000000000000000.0)'],
    ])

    //inconsistency with product #1
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(-1,5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('truncates numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(B1:C1)', 5.5, 10],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=GCD(NA(),4)'],
      ['=GCD(B2:C2)', '=NA()', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
  })
})
