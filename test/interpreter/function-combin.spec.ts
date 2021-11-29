import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COMBIN', () => {
  it('checks number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(1)', '=COMBIN(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(0,0)'],
      ['=COMBIN(1,0)'],
      ['=COMBIN(4,2)'],
      ['=COMBIN(9,6)'],
      ['=COMBIN(20,10)'],
      ['=COMBIN(30,10)'],
      ['=COMBIN(40,10)'],
      ['=COMBIN(100,99)'],
      ['=COMBIN(100,8)'],
      ['=COMBIN(1029,512)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(6)
    expect(engine.getCellValue(adr('A4'))).toBe(84)
    expect(engine.getCellValue(adr('A5'))).toBe(184756)
    expect(engine.getCellValue(adr('A6'))).toBe(30045015)
    expect(engine.getCellValue(adr('A7'))).toBe(847660528)
    expect(engine.getCellValue(adr('A8'))).toBe(100)
    expect(engine.getCellValue(adr('A9'))).toBe(186087894300)
    expect(engine.getCellValue(adr('A10')) as number / 1.41325918108873e+308).toBeCloseTo(1, 6)
  })

  it('truncates argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(9.9,6.6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(84)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(1.1, 1.2)'],
      ['=COMBIN(1, 2)'],
      ['=COMBIN(2, -1)'],
      ['=COMBIN(-1, -1)'],
      ['=COMBIN(1030, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WrongOrder))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WrongOrder))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //inconsistency with product #2
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('uses coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(TRUE(),"0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('propagates error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COMBIN(NA(), NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
