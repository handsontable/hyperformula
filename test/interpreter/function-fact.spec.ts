import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FACT', () => {
  it('checks number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT()', '=FACT(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT(0)'],
      ['=FACT(1)'],
      ['=FACT(10)'],
      ['=FACT(170)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(3628800)
    expect(engine.getCellValue(adr('A4')) as number / 7.257415615307999e+306).toBeCloseTo(1, 6)
  })

  it('rounds argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT(0.9)'],
      ['=FACT(1.1)'],
      ['=FACT(10.42)'],
      ['=FACT(169.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(3628800)
    expect(engine.getCellValue(adr('A4')) as number / 4.2690680090046997e+304).toBeCloseTo(1, 6)
  })

  it('checks bounds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT(-1)'],
      ['=FACT(171)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('uses coercion', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT("0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('propagates error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FACT(NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
