import {HyperFormula} from "../../src"
import {ErrorType} from "../../src/Cell"
import {adr, detailedError} from "../testUtils"

describe('Function CHAR', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHAR()'],
      ['=CHAR(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHAR("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHAR(1)'],
      ['=CHAR(33)'],
      ['=CHAR(65)'],
      ['=CHAR(90)'],
      ['=CHAR(209)'],
      ['=CHAR(255)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('!')
    expect(engine.getCellValue(adr('A3'))).toEqual('A')
    expect(engine.getCellValue(adr('A4'))).toEqual('Z')
    expect(engine.getCellValue(adr('A5'))).toEqual('Ñ')
    expect(engine.getCellValue(adr('A6'))).toEqual('ÿ')
  })

  it('should round down floats', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHAR(42)'],
      ['=CHAR(42.2)'],
      ['=CHAR(42.8)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('*')
    expect(engine.getCellValue(adr('A2'))).toEqual('*')
    expect(engine.getCellValue(adr('A3'))).toEqual('*')
  })

  it('should work only for numbers from 1 to 255', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHAR(0)'],
      ['=CHAR(1)'],
      ['=CHAR(255)'],
      ['=CHAR(256)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual('')
    expect(engine.getCellValue(adr('A3'))).toEqual('ÿ')
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NUM))
  })
})
