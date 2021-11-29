import {EvaluationSuspendedError, ExportedCellChange, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellType} from '../src/Cell'
import {adr} from './testUtils'

describe('Evaluation suspension', () => {
  it('by default, evaluation is automatic', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    engine.setCellContents(adr('C1'), [['=B1']])

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('when evaluation is stopped, getting cell values is forbidden', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()

    expect(() => {
      engine.getCellValue(adr('C1'))
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getSheetValues(0)
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getAllSheetsValues()
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2))
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getNamedExpressionValue('FOO')
    }).toThrow(new EvaluationSuspendedError())
  })

  it('when evaluation is stopped, getting serialized cell values is forbidden', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()

    expect(() => {
      engine.getCellSerialized(adr('C1'))
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getSheetSerialized(0)
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getAllSheetsSerialized()
    }).toThrow(new EvaluationSuspendedError())
    expect(() => {
      engine.getRangeSerialized(AbsoluteCellRange.spanFrom(adr('A1'), 1, 2))
    }).toThrow(new EvaluationSuspendedError())
  })

  it('when evaluation is stopped, getting cell value types is forbidden', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()

    expect(() => {
      engine.getCellValueType(adr('C1'))
    }).toThrow(new EvaluationSuspendedError())
  })

  it('when evaluation is stopped, getting cell types is possible', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellType(adr('C1'))).toEqual(CellType.FORMULA)
    expect(engine.doesCellHaveSimpleValue(adr('C1'))).toBe(false)
    expect(engine.doesCellHaveFormula(adr('C1'))).toBe(true)
    expect(engine.isCellEmpty(adr('C1'))).toBe(false)
    expect(engine.isCellPartOfArray(adr('C1'))).toBe(false)
  })

  it('when evaluation is stopped, getting cell formulas is possible', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1+42'],
    ])
    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A1+78')
    expect(engine.getSheetFormulas(0)).toEqual([[undefined, undefined, '=A1+78']])
    expect(engine.getAllSheetsFormulas()).toEqual({Sheet1: [[undefined, undefined, '=A1+78']]})
    expect(engine.getRangeFormulas(AbsoluteCellRange.spanFrom(adr('A1'), 3, 1))).toEqual([[undefined, undefined, '=A1+78']])
  })

  it('formulas are rebuild even if evaluation is suspended', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A2+42'],
      ['42']
    ])
    engine.suspendEvaluation()

    engine.addRows(0, [1, 1])

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A3+42')
  })

  it('resuming evaluation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()
    engine.setCellContents(adr('C1'), [['=B1']])

    const [changes] = engine.resumeEvaluation()

    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('C1'), 2))
  })

  it('#isEvaluationSuspended when evaluation is suspended', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()

    expect(engine.isEvaluationSuspended()).toBe(true)
  })

  it('#isEvaluationSuspended when evaluation is resumed', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    expect(engine.isEvaluationSuspended()).toBe(false)
  })

  describe('clipboard operations depend on values, so they are forbidden', () => {
    it('copy', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.suspendEvaluation()

      expect(() => {
        engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      }).toThrow(new EvaluationSuspendedError())
    })

    it('cut', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.suspendEvaluation()

      expect(() => {
        engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      }).toThrow(new EvaluationSuspendedError())
    })

    it('paste', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      engine.suspendEvaluation()

      expect(() => {
        engine.paste(adr('A3'))
      }).toThrow(new EvaluationSuspendedError())
    })
  })

  it('undo-redo works when computation suspended', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A2+42'],
      ['42']
    ])
    engine.suspendEvaluation()
    engine.addRows(0, [1, 1])

    engine.undo()

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A2+42')
  })
})
