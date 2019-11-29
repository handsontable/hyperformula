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
    const engine = HyperFormula.buildFromArray([['1', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('with empty strings', () => {
    const engine = HyperFormula.buildFromArray([['', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('does not propagate errors from ranges', () => {
    const engine = HyperFormula.buildFromArray([
      [null],
      ['=4/0'],
      ['=COUNTBLANK(A1:A2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('does not propagate errors from arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTBLANK(4/0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })
})
