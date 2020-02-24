import {HyperFormula} from '../src'
import './testConfig'
import {adr} from './testUtils'

describe('Named expressions', () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    expect(engine.getNamedExpressionValue('myName')).toEqual(52)
  })

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    engine.setCellContents(adr('A1'), '20')

    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName1', '=Sheet1!A1+10')
    engine.addNamedExpression('myName2', '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName2')).toEqual(53)
  })

  it('adding the same named expression twice is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10')
    }).toThrowError('Name of Named Expression \'myName\' is already present in the workbook')
  })

  it('named expressions is validated when added', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('1definitelyIncorrectName', '=42')
    }).toThrowError("Name of Named Expression '1definitelyIncorrectName' is invalid")
  })

  it('retrieving non-existing named expression', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.getNamedExpressionValue('nonExistentNameExpression')).toBe(null)
  })

  it('removing named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1')

    engine.removeNamedExpression('myName')

    expect(engine.getNamedExpressionValue('myName')).toBe(null)
    expect(engine.setCellContents(adr('A1'), '43').length).toBe(1)
  })

  it('is possible to change named expression formula to other', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    engine.changeNamedExpressionFormula('myName', '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })

  it('changing not existing named expression', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpressionFormula('myName', '=42')
    }).toThrowError("Named Expression 'myName' does not exist")
  })

  it('listing named expressions', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName1', '=42')
    engine.addNamedExpression('myName2', '=42')

    const namedExpressions = engine.listNamedExpressions()

    expect(namedExpressions).toEqual([
      'myName1',
      'myName2',
    ])
  })

  it('adding named expressions is case insensitive', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addNamedExpression('myName', '=42')

    expect(engine.getNamedExpressionValue('MYname')).toEqual(42)
    expect(() => {
      engine.changeNamedExpressionFormula('MYname', '=43')
    }).not.toThrow()
    expect(() => {
      engine.removeNamedExpression('MYname')
    }).not.toThrow()
  })
})
