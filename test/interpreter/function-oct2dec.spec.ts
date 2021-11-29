import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function OCT2DEC', () => {
  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for non-oct arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC("foo")'],
      ['=OCT2DEC(418)'],
      ['=OCT2DEC(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC(1)'],
      ['=OCT2DEC(10)'],
      ['=OCT2DEC(71)'],
      ['=OCT2DEC(12345)'],
      ['=OCT2DEC(4242565)'],
      ['=OCT2DEC(1234567654)'],
      ['=OCT2DEC(7777777000)'],
      ['=OCT2DEC(7777777042)'],
      ['=OCT2DEC(7777777777)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(8)
    expect(engine.getCellValue(adr('A3'))).toEqual(57)
    expect(engine.getCellValue(adr('A4'))).toEqual(5349)
    expect(engine.getCellValue(adr('A5'))).toEqual(1131893)
    expect(engine.getCellValue(adr('A6'))).toEqual(175304620)
    expect(engine.getCellValue(adr('A7'))).toEqual(-512)
    expect(engine.getCellValue(adr('A8'))).toEqual(-478)
    expect(engine.getCellValue(adr('A9'))).toEqual(-1)
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC("456")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(302)
  })

  it('should work for reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="123"'],
      ['=OCT2DEC(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(83)
  })

  it('should return a number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC(11)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.NUMBER)
  })

  it('should work only for 10 digits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2DEC(10107040205)'],
      ['=OCT2DEC(7777777042)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A2'))).toEqual(-478)
  })
})
