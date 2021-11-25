import {EvaluationSuspendedError, ExportedCellChange, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellType} from '../src/Cell'
import {adr} from './testUtils'

describe('Evaluation suspension', () => {
  it('by default, evaluation is automatic', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    await engine.setCellContents(adr('C1'), [['=B1']])

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('when evaluation is stopped, getting cell values is forbidden', async() => {
const engine = await HyperFormula.buildFromArray([
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

  it('when evaluation is stopped, getting serialized cell values is forbidden', async() => {
const engine = await HyperFormula.buildFromArray([
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

  it('when evaluation is stopped, getting cell value types is forbidden', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()

    expect(() => {
      engine.getCellValueType(adr('C1'))
    }).toThrow(new EvaluationSuspendedError())
  })

  it('when evaluation is stopped, getting cell types is possible', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '42'],
    ])

    engine.suspendEvaluation()
    await engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellType(adr('C1'))).toEqual(CellType.FORMULA)
    expect(engine.doesCellHaveSimpleValue(adr('C1'))).toBe(false)
    expect(engine.doesCellHaveFormula(adr('C1'))).toBe(true)
    expect(engine.isCellEmpty(adr('C1'))).toBe(false)
    expect(engine.isCellPartOfArray(adr('C1'))).toBe(false)
  })

  it('when evaluation is stopped, getting cell formulas is possible', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A1+42'],
    ])
    engine.suspendEvaluation()
    await engine.setCellContents(adr('C1'), [['=A1+78']])

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A1+78')
    expect(engine.getSheetFormulas(0)).toEqual([[undefined, undefined, '=A1+78']])
    expect(engine.getAllSheetsFormulas()).toEqual({ Sheet1: [[undefined, undefined, '=A1+78']] })
    expect(engine.getRangeFormulas(AbsoluteCellRange.spanFrom(adr('A1'), 3, 1))).toEqual([[undefined, undefined, '=A1+78']])
  })

  it('formulas are rebuild even if evaluation is suspended', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A2+42'],
      ['42']
    ])
    engine.suspendEvaluation()

    await engine.addRows(0, [1, 1])

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A3+42')
  })

  it('resuming evaluation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()
    await engine.setCellContents(adr('C1'), [['=B1']])

    const changes = await engine.resumeEvaluation()

    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('C1'), 2))
  })

  it('#isEvaluationSuspended when evaluation is suspended', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])
    engine.suspendEvaluation()

    expect(engine.isEvaluationSuspended()).toBe(true)
  })

  it('#isEvaluationSuspended when evaluation is resumed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A1'],
    ])

    expect(engine.isEvaluationSuspended()).toBe(false)
  })

  describe('clipboard operations depend on values, so they are forbidden', () => {
    it('copy', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.suspendEvaluation()

      expect(() => {
        engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      }).toThrow(new EvaluationSuspendedError())
    })

    it('cut', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.suspendEvaluation()

      expect(() => {
        engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      }).toThrow(new EvaluationSuspendedError())
    })

    it('paste', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '=A1'],
      ])
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
      engine.suspendEvaluation()

      await expect(async() => {
        await engine.paste(adr('A3'))
      }).rejects.toThrow(new EvaluationSuspendedError())
    })
  })

  it('undo-redo works when computation suspended', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=A2+42'],
      ['42']
    ])
    engine.suspendEvaluation()
    await engine.addRows(0, [1, 1])

    await engine.undo()

    expect(engine.getCellFormula(adr('C1'))).toEqual('=A2+42')
  })
})
