import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Interpreter', () => {
  it('function EXP happy path',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP(0)', '=EXP(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(7.38905609893065)
  })

  it('function EXP given wrong argument type',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function EXP given wrong number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EXP()'],
      ['=EXP(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NA))
  })
})
