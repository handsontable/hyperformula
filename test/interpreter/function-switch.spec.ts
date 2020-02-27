import {Config, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - SWITCH function', () => {
  it('Should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(1)', '=SWITCH(2,3)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('Should work with more arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(1,2,3)', '=SWITCH(1,2,3,4)', '=SWITCH(1,2,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('Should work with precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1.0000000001', '3', '1.0000000000001', '5'],
      ['=SWITCH(A1,B1,C1,D1,E1)']
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('Should work with strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['abc', '1', '3', 'ABC', '5'],
      ['=SWITCH(A1,B1,C1,D1,E1)']
    ], new Config({caseSensitive: false}))
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })
  it('Should fail with error in first argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(1/0,1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
  it('Should not fail with error in other arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(4,1/0,3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
  it('Should pass errors as normal values', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(4,2,3,4,1/0)', '=SWITCH(1,2,3,4,1/0,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqual(5)
  })
  it('Should fail with range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SWITCH(1,2,A2:A3,4,5)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
