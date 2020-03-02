import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - CHOOSE function', () => {
  it('Should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(0)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('Should work with more arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(1,2,3)', '=CHOOSE(3,2,3,4)', '=CHOOSE(2,2,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })

  it('Should fail when wrong first argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(1.5,2,3)', '=CHOOSE(0,2,3,4)', '=CHOOSE(5,2,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('Coercions', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(TRUE(),2,3)', '=CHOOSE("12/31/1899",2,3,4)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('Should fail with error in first argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
  it('Should not fail with error in other arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(4,1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
  it('Should pass errors as normal values', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(4,2,3,4,1/0)', '=CHOOSE(1,2,3,4,COS(1,1),5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })
  it('Should fail with range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CHOOSE(1,2,A2:A3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
