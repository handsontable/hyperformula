import {CellError, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Error literals', () => {
  it('Errors should be parsed and propagated', () => {
    const engine = HyperFormula.buildFromArray([
      ['#DIV/0!', '=A1', '=#DIV/0!'],
      ['=ISERROR(A1)', '=ISERROR(B1)', '=ISERROR(C1)', '=ISERROR(#DIV/0!)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
    expect(engine.getCellValue(adr('C2'))).toEqual(true)
  })

  it('should return error when unknown error literal in formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['#UNKNOWN!', '=#UNKNOWN!']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('#UNKNOWN!')
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NAME))
  })
})
