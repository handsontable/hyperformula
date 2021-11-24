import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LCM', () => {
  it('checks required number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('computes correct answer for two args', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(2*3*5,3*5*7)', '=LCM(0,1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2*3*5*7)
    expect(engine.getCellValue(adr('B1'))).toBe(0)
  })

  it('computes correct answer for more than two args', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(2*3*5,3*5*7, 2*5*7)', '=LCM(100,101,102,103, 104)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2*3*5*7)
    expect(engine.getCellValue(adr('B1'))).toBe(1379437800)
  })

  it('works with zeroes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(2*3*5,3*5*7, 2*5*7, 0, 0, 0)', '=LCM(0, 0, 100,101,102,103,104, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBe(0)
  })

  it('accepts single arg', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(1)', '=LCM(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(0)
  })

  it('handles overflow', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(1000000,1000001,1000002,1000003)'],
    ])

    //inconsistency with product #1
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('coerces to number', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM("4",2)'],
      ['=LCM(B2:C2)', '\'4', 2],
      ['=LCM(FALSE(),4)'],
      ['=LCM(B4:C4)', false, 4],
      ['=LCM(,4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(4)
    expect(engine.getCellValue(adr('A2'))).toBe(4)
    expect(engine.getCellValue(adr('A3'))).toBe(0)
    expect(engine.getCellValue(adr('A4'))).toBe(0)
    expect(engine.getCellValue(adr('A5'))).toBe(0)
  })

  it('ignores non-coercible values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(B1:C1)', 'abcd', 4],
      ['=LCM(B2:C2)', null, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(4)
    expect(engine.getCellValue(adr('A2'))).toBe(4)
  })

  it('throws error for non-coercible values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM("abcd",4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('checks bounds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(-1,5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('truncates numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(B1:C1)', 5.5, 10],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(10)
  })

  it('propagates errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LCM(NA(),4)'],
      ['=LCM(B2:C2)', '=NA()', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
  })
})
