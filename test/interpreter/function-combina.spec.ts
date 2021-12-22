import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COMBINA', () => {
  it('checks number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(1)', '=COMBINA(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(0,0)'],
      ['=COMBINA(1,0)'],
      ['=COMBINA(2,2)'],
      ['=COMBINA(0,2)'],
      ['=COMBINA(10,10)'],
      ['=COMBINA(20,10)'],
      ['=COMBINA(30,10)'],
      ['=COMBINA(100,500)'],
      ['=COMBINA(100,8)'],
      ['=COMBINA(518,512)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(3)
    expect(engine.getCellValue(adr('A4'))).toBe(1)
    expect(engine.getCellValue(adr('A5'))).toBe(92378)
    expect(engine.getCellValue(adr('A6'))).toBe(20030010)
    expect(engine.getCellValue(adr('A7'))).toBe(635745396)
    expect(engine.getCellValue(adr('A8')) as number / 1.8523520317769801e+115).toBeCloseTo(1, 6)
    expect(engine.getCellValue(adr('A9'))).toBe(325949656825)
    expect(engine.getCellValue(adr('A10')) as number / 1.41325918108873e+308).toBeCloseTo(1, 6)
  })

  it('truncates argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(9.9,6.6)'],
      ['=COMBINA(518, 512.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3003)
    expect(engine.getCellValue(adr('A2')) as number / 1.41325918108873e+308).toBeCloseTo(1)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(2, -1)'],
      ['=COMBINA(-1, 2)'],
      ['=COMBINA(1031, 0)'],
      ['=COMBINA(518, 513)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('uses coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(TRUE(),"0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('propagates error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBINA(NA(), NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
