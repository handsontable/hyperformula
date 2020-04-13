import {HyperFormula, ExportedNamedExpressionChange, EmptyValue} from '../src'
import './testConfig'
import {adr, detailedError} from './testUtils'
import {ErrorType} from '../src/Cell'

describe('Named expressions', () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    expect(engine.getNamedExpressionValue('myName')).toEqual(52)
  })

  it('using string expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', 'foobarbaz')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 'foobarbaz')])
    expect(engine.getNamedExpressionValue('myName')).toEqual('foobarbaz')
  })

  it('using number expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', '42')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using empty expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', null)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', EmptyValue)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(EmptyValue)
  })

  it('using native number as expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', 42)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using native boolean as expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', true)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', true)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(true)
  })

  it('using error expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', '#VALUE!')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', detailedError(ErrorType.VALUE))])
    expect(engine.getNamedExpressionValue('myName')).toEqual(detailedError(ErrorType.VALUE))
  })

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    const changes = engine.setCellContents(adr('A1'), '20')

    expect(changes.length).toBe(2)
    expect(changes).toContainEqual(new ExportedNamedExpressionChange('myName', 30))
    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName.1', '=Sheet1!A1+10')
    engine.addNamedExpression('myName.2', '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName.1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName.2')).toEqual(53)
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

  it('when adding named expression, matrix formulas are not accepted', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('myName', '{=TRANSPOSE(A1:B2)}')
    }).toThrowError(/Matrix formulas are not supported/)
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

    engine.changeNamedExpression('myName', '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })

  it('is possible to change named expression formula to other expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    engine.changeNamedExpression('myName', 58)

    expect(engine.getNamedExpressionValue('myName')).toEqual(58)
  })

  it('when changing named expression, only formulas are accepted', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addNamedExpression('myName', '=42')

    expect(() => {
      engine.changeNamedExpression('myName', '{=TRANSPOSE(A1:B2)}')
    }).toThrowError(/not supported/)
  })

  it('changing not existing named expression', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', '=42')
    }).toThrowError("Named Expression 'myName' does not exist")
  })

  it('listing named expressions', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName.1', '=42')
    engine.addNamedExpression('myName.2', '=42')

    const namedExpressions = engine.listNamedExpressions()

    expect(namedExpressions).toEqual([
      'myName.1',
      'myName.2',
    ])
  })

  it('adding named expressions is case insensitive', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addNamedExpression('myName', '=42')

    expect(engine.getNamedExpressionValue('MYname')).toEqual(42)
    expect(() => {
      engine.changeNamedExpression('MYname', '=43')
    }).not.toThrowError()
    expect(() => {
      engine.removeNamedExpression('MYname')
    }).not.toThrowError()
  })

  it('allow even 255 character named expressions', () => {
    const engine = HyperFormula.buildEmpty()

    const longExpressionName = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

    expect(longExpressionName.length).toBe(255)
    expect(() => {
      engine.addNamedExpression(longExpressionName, '=42')
    }).not.toThrowError()
  })

  it('validates characters which are allowed in name', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => engine.addNamedExpression('1CantStartWithNumber', '=42')).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('Spaces Are Not Allowed', '=42')).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('.CantStartWithDot', '=42')).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('_CanStartWithUnderscore', '=42')).not.toThrowError()
    expect(() => engine.addNamedExpression('dots.are.fine', '=42')).not.toThrowError()
    expect(() => engine.addNamedExpression('underscores_are_fine', '=42')).not.toThrowError()
    expect(() => engine.addNamedExpression('ś.zażółć.gęślą.jaźń.unicode.is.fine', '=42')).not.toThrowError()
    expect(() => engine.addNamedExpression('If.It.Only.Has.Something.Like.Reference.Not.In.Beginning.Then.Its.Ok.A100', '=42')).not.toThrowError()
    expect(() => engine.addNamedExpression('A100', '=42')).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('$A$50', '=42')).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('SheetName!$A$50', '=42')).toThrowError(/Name .* is invalid/)
  })
})
