import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'

describe('address queries', () => {
  it('reverse dependencies should work', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
      ['=A2+B2'],
    ])
    expect(engine.getCellReverseDependencies(adr('A1'))).toEqual([new AbsoluteCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellReverseDependencies(adr('D1'))).toEqual([])
    expect(engine.getCellReverseDependencies(adr('A2'))).toEqual([adr('A3')])
    expect(engine.getCellReverseDependencies(adr('B2'))).toEqual([adr('A3')])
    expect(engine.getCellReverseDependencies(adr('A3'))).toEqual([])

    expect(engine.getCellReverseDependencies(new AbsoluteCellRange(adr('A1'), adr('B1')))).toEqual([adr('A2'), adr('B2')])
    expect(engine.getCellReverseDependencies(new AbsoluteCellRange(adr('A3'), adr('B3')))).toEqual([])
  })

  it('dependencies should work', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
      ['=A2+B2'],
    ])
    expect(engine.getCellDependencies(adr('A1'))).toEqual([])
    expect(engine.getCellDependencies(adr('D1'))).toEqual([])
    expect(engine.getCellDependencies(adr('A2'))).toEqual([new AbsoluteCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellDependencies(adr('B2'))).toEqual([new AbsoluteCellRange(adr('A1'), adr('B1'))])
    expect(engine.getCellDependencies(adr('A3'))).toEqual([adr('A2'), adr('B2')])

    expect(engine.getCellDependencies(new AbsoluteCellRange(adr('A1'), adr('B1')))).toEqual([adr('A1'), adr('B1')])
    expect(engine.getCellDependencies(new AbsoluteCellRange(adr('A3'), adr('B3')))).toEqual([])
  })
})
