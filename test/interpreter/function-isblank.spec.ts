import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Interpreter', () => {
  it('function ISBLANK should return true for references to empty cells',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['', '=ISBLANK(A1)', '=ISBLANK($A1)', '=ISBLANK(OFFSET(C1,0,-2))', '=ISBLANK(A2)'],
      ['=A1'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
    expect(engine.getCellValue(adr('D1'))).toEqual(true)
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
  })

  it('function ISBLANK should return false if it is not reference to empty cell',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['', '=ISBLANK("")', '=ISBLANK(4)', '=ISBLANK(CONCATENATE(A1,A1))'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
  })

  it('function ISBLANK takes exactly one argument',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ISBLANK(A3, A2)', '=ISBLANK()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })
})
