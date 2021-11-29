import {HyperFormula} from '../src'
import {simpleCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'

describe('address queries', () => {
  it('reverse dependencies should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 3],
      ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
      ['=A2+B2'],
    ])
    expect(engine.getCellDependents(adr('A1'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellDependents(adr('D1'))).toEqual([])
    expect(engine.getCellDependents(adr('A2'))).toEqual([adr('A3')])
    expect(engine.getCellDependents(adr('B2'))).toEqual([adr('A3')])
    expect(engine.getCellDependents(adr('A3'))).toEqual([])

    expect(engine.getCellDependents(simpleCellRange(adr('A1'), adr('B1')))).toEqual([adr('A2'), adr('B2')])
    expect(engine.getCellDependents(simpleCellRange(adr('A3'), adr('B3')))).toEqual([])
  })

  it('dependencies should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 3],
      ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
      ['=A2+B2'],
    ])
    expect(engine.getCellPrecedents(adr('A1'))).toEqual([])
    expect(engine.getCellPrecedents(adr('D1'))).toEqual([])
    expect(engine.getCellPrecedents(adr('A2'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellPrecedents(adr('B2'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellPrecedents(adr('A3'))).toEqual([adr('A2'), adr('B2')])

    expect(engine.getCellPrecedents(simpleCellRange(adr('A1'), adr('B1')))).toEqual([adr('A1'), adr('B1')])
    expect(engine.getCellPrecedents(simpleCellRange(adr('A3'), adr('B3')))).toEqual([])
  })
})
