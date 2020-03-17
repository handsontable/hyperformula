import {HyperFormula, PendingComputationError, ExportedCellChange} from '../src'
import './testConfig'
import {adr} from './testUtils'

describe('Computation suspension', () => {
  it('by default, recomputation is automatic', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    engine.setCellContents(adr('C1'), [['=B1']])

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('when recomputation is stopped, #getCellValue is forbidden', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])
    engine.suspendComputation()
    engine.setCellContents(adr('C1'), [['78']])

    expect(() => {
      engine.getCellValue(adr('C1'))
    }).toThrow(new PendingComputationError())
  })

  it('when recomputation is stopped, #getCellFormula is possible', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1+42'],
    ])
    engine.suspendComputation()
    engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellFormula(adr('C1'))).toEqual("=A1+78")
  })

  it('resuming computation', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendComputation()
    engine.setCellContents(adr('C1'), [['=B1']])

    const changes = engine.resumeComputation()

    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('C1'), 2))
  })
})
