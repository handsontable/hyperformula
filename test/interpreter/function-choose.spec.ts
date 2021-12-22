import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - CHOOSE function', () => {
  it('Should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(0)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('Should work with more arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(1,2,3)', '=CHOOSE(3,2,3,4)', '=CHOOSE(2,2,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })

  it('should preserve types', () => {
    const [engine] = HyperFormula.buildFromArray([['=CHOOSE(1,B1,3)', '1%']])

    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('preserves types of second arg', () => {
    const [engine] = HyperFormula.buildFromArray([['=IFERROR(NA(), B1)', '1%']])

    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('Should fail when wrong first argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(1.5,2,3)', '=CHOOSE(0,2,3,4)', '=CHOOSE(5,2,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.Selector))
  })

  it('Coercions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(TRUE(),2,3)', '=CHOOSE("31/12/1899",2,3,4)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('Should fail with error in first argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
  it('Should not fail with error in other arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(4,1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
  it('Should pass errors as normal values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(4,2,3,4,1/0)', '=CHOOSE(1,2,3,4,COS(1,1),5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })
  it('Should fail with range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHOOSE(1,2,A2:A3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
