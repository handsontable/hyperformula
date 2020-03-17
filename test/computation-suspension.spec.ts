import {HyperFormula, PendingComputationError, ExportedCellChange} from '../src'
import './testConfig'
import {adr} from './testUtils'

describe('Evaluation suspension', () => {
  it('by default, evaluation is automatic', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    engine.setCellContents(adr('C1'), [['=B1']])

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('when evaluation is stopped, #getCellValue is forbidden', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])
    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['78']])

    expect(() => {
      engine.getCellValue(adr('C1'))
    }).toThrow(new PendingComputationError())
  })

  it('when evaluation is stopped, #getCellFormula is possible', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1+42'],
    ])
    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A1+78')
  })

  it('resuming evaluation', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['=B1']])

    const changes = engine.resumeEvaluation()

    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('C1'), 2))
  })

  it('#isEvaluationSuspended when evaluation is suspended', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()

    expect(engine.isEvaluationSuspended()).toBe(true)
  })

  it('#isEvaluationSuspended when evaluation is resumed', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    expect(engine.isEvaluationSuspended()).toBe(false)
  })
})
