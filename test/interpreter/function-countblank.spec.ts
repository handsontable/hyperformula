import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('COUNTBLANK', () => {
  it('with empty args', () => {
    const engine = HyperFormula.buildFromArray([['=COUNTBLANK()']])
    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('with args', () => {
    const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B1, C1)', '3.14']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('with range', () => {
    const engine = HyperFormula.buildFromArray([['1', '', '', '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })
})
