import {HyperFormula, ExportedNamedExpressionChange, EmptyValue} from '../src'
import {adr, detailedError} from './testUtils'
import {ErrorType} from '../src/Cell'
import {NoSheetWithNameError} from '../src/errors'
import {Vertex} from '../src/DependencyGraph/Vertex'

describe('Named expressions - store manipulation', () => {
  it('basic usage with global named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)

    expect(engine.getNamedExpressionValue('myName')).toEqual(52)
  })

  it('using string expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', 'foobarbaz', undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 'foobarbaz')])
    expect(engine.getNamedExpressionValue('myName')).toEqual('foobarbaz')
  })

  it('using number expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', '42', undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using empty expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', null, undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', EmptyValue)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(EmptyValue)
  })

  it('using native number as expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', 42, undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using native boolean as expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', true, undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', true)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(true)
  })

  it('using error expression', () => {
    const engine = HyperFormula.buildEmpty()

    const changes = engine.addNamedExpression('myName', '#VALUE!', undefined)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', detailedError(ErrorType.VALUE))])
    expect(engine.getNamedExpressionValue('myName')).toEqual(detailedError(ErrorType.VALUE))
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName.1', '=Sheet1!A1+10', undefined)
    engine.addNamedExpression('myName.2', '=Sheet1!A1+11', undefined)

    expect(engine.getNamedExpressionValue('myName.1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName.2')).toEqual(53)
  })

  it('adding the same named expression twice on global level is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('adding the same named expression twice on  local level is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!A1+10', 'Sheet1')

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10', 'Sheet1')
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('named expressions is validated when added', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('1definitelyIncorrectName', '=42', undefined)
    }).toThrowError("Name of Named Expression '1definitelyIncorrectName' is invalid")
  })

  it('when adding named expression, matrix formulas are not accepted', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('myName', '{=TRANSPOSE(A1:B2)}', undefined)
    }).toThrowError(/Matrix formulas are not supported/)
  })

  it('retrieving non-existing named expression', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.getNamedExpressionValue('nonExistentNameExpression')).toBe(undefined)
    expect(engine.getNamedExpressionFormula('nonExistentNameExpression')).toBe(undefined)
  })

  it('removing named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1', undefined)

    engine.removeNamedExpression('myName', undefined)

    expect(engine.getNamedExpressionValue('myName')).toBe(undefined)
    expect(engine.setCellContents(adr('A1'), '43').length).toBe(1)
  })

  it('removing local named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '13', undefined)
    engine.addNamedExpression('myName', '=Sheet1!A1', 'Sheet1')

    engine.removeNamedExpression('myName', 'Sheet1')

    expect(engine.getNamedExpressionValue('myName', 'Sheet1')).toBe(undefined)
    expect(engine.getNamedExpressionValue('myName', undefined)).toBe(13)
  })

  it('is possible to change named expression formula to other', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)

    engine.changeNamedExpression('myName', undefined, '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })

  it('is possible to change named expression formula to other expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)

    engine.changeNamedExpression('myName', undefined, 58)

    expect(engine.getNamedExpressionValue('myName')).toEqual(58)
  })

  it('is possible to change named expression formula on local level', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=100', 'Sheet1')

    engine.changeNamedExpression('myName', 'Sheet1', '=200')

    expect(engine.getNamedExpressionValue('myName', 'Sheet1')).toEqual(200)
  })

  it('when changing named expression, matrices are not supported', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addNamedExpression('myName', '=42', undefined)

    expect(() => {
      engine.changeNamedExpression('myName', undefined, '{=TRANSPOSE(A1:B2)}')
    }).toThrowError(/not supported/)
  })

  it('changing not existing named expression', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', undefined, '=42')
    }).toThrowError("Named Expression 'myName' does not exist")
  })

  it('changing named expression from non existing sheet', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', 'NonExistingSheet', '=42')
    }).toThrowError(NoSheetWithNameError)
  })

  it('listing named expressions', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName.1', '=42', undefined)
    engine.addNamedExpression('myName.2', '=42', undefined)

    const namedExpressions = engine.listNamedExpressions()

    expect(namedExpressions).toEqual([
      'myName.1',
      'myName.2',
    ])
  })

  it('adding named expressions is case insensitive', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addNamedExpression('myName', '=42', undefined)

    expect(engine.getNamedExpressionValue('MYname')).toEqual(42)
    expect(() => {
      engine.changeNamedExpression('MYname', undefined, '=43')
    }).not.toThrowError()
    expect(() => {
      engine.removeNamedExpression('MYname', undefined)
    }).not.toThrowError()
  })

  it('allow even 255 character named expressions', () => {
    const engine = HyperFormula.buildEmpty()

    const longExpressionName = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

    expect(longExpressionName.length).toBe(255)
    expect(() => {
      engine.addNamedExpression(longExpressionName, '=42', undefined)
    }).not.toThrowError()
  })

  it('validates characters which are allowed in name', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => engine.addNamedExpression('1CantStartWithNumber', '=42', undefined)).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('Spaces Are Not Allowed', '=42', undefined)).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('.CantStartWithDot', '=42', undefined)).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('_CanStartWithUnderscore', '=42', undefined)).not.toThrowError()
    expect(() => engine.addNamedExpression('dots.are.fine', '=42', undefined)).not.toThrowError()
    expect(() => engine.addNamedExpression('underscores_are_fine', '=42', undefined)).not.toThrowError()
    expect(() => engine.addNamedExpression('ś.zażółć.gęślą.jaźń.unicode.is.fine', '=42', undefined)).not.toThrowError()
    expect(() => engine.addNamedExpression('If.It.Only.Has.Something.Like.Reference.Not.In.Beginning.Then.Its.Ok.A100', '=42', undefined)).not.toThrowError()
    expect(() => engine.addNamedExpression('A100', '=42', undefined)).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('$A$50', '=42', undefined)).toThrowError(/Name .* is invalid/)
    expect(() => engine.addNamedExpression('SheetName!$A$50', '=42', undefined)).toThrowError(/Name .* is invalid/)
  })

  it('#getNamedExpressionFormula when it exists', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('myName.1', '=Sheet1!A1+10', undefined)

    expect(engine.getNamedExpressionFormula('myName.1')).toEqual('=Sheet1!A1+10')
  })

  it('#getNamedExpressionFormula when there is no such named expression', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.getNamedExpressionFormula('not.existing')).toBeUndefined()
  })

  it('#getNamedExpressionFormula when named expression is not formula', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('myName.1', '42', undefined)

    expect(engine.getNamedExpressionFormula('myName.1')).toBeUndefined()
  })

  it('#getNamedExpressionFormula when there is no such sheet', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(() => {
      engine.getNamedExpressionFormula('myName.1', 'NonExistingSheetName')
    }).toThrowError(NoSheetWithNameError)
  })

  it('local level named expressions have separate storages', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=42', undefined)
    engine.addNamedExpression('myName', '=13', 'Sheet1')

    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
    expect(engine.getNamedExpressionValue('myName', 'Sheet1')).toEqual(13)
    expect(engine.getNamedExpressionFormula('myName')).toEqual('=42')
    expect(engine.getNamedExpressionFormula('myName', 'Sheet1')).toEqual('=13')
  })

  it('when trying to add named expression to nonexisting sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    expect(() => {
      engine.addNamedExpression('myName', '=13', 'NonExistingSheetName')
    }).toThrowError(NoSheetWithNameError)
  })
})

const namedExpressionVertex = (engine: HyperFormula, expressionName: string, sheetId: number | undefined): Vertex => {
  let namedExpression
  if (sheetId === undefined) {
    namedExpression = engine.dependencyGraph.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)!
  } else {
    namedExpression = engine.dependencyGraph.namedExpressions.namedExpressionForScope(expressionName, sheetId)!
  }
  return engine.dependencyGraph.fetchCell(namedExpression.address)
}

describe('Named expressions - evaluation', () => {
  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10', undefined)

    const changes = engine.setCellContents(adr('A1'), '20')

    expect(changes.length).toBe(2)
    expect(changes).toContainEqual([new ExportedNamedExpressionChange('myName', 30)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('adds edge to dependency', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42', undefined)

    engine.setCellContents(adr('A1'), '=FOO+10')

    const fooVertex = engine.dependencyGraph.namedExpressionVertex('FOO', 0)!
      const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(fooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(52)
  })

  it('NAME error when there is no such named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FOO']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('named expression dependency works if named expression was defined later', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FOO']
    ])

    engine.addNamedExpression('FOO', '=42', undefined)

    const fooVertex = engine.dependencyGraph.namedExpressionVertex('FOO', 0)!
      const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(fooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  it('removed named expression returns NAME error', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42', undefined)
    engine.setCellContents(adr('A1'), '=FOO+10')

    engine.removeNamedExpression('FOO', undefined)

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('removing node dependent on named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42', undefined)
    engine.setCellContents(adr('A1'), '=FOO+10')

    engine.setCellContents(adr('A1'), null)

    const fooVertex = engine.dependencyGraph.namedExpressionVertex('FOO', 0)!
      expect(engine.graph.adjacentNodes(fooVertex).size).toBe(0)
  })

  it('named expressions are transformed during CRUDs', () => {
    const engine = HyperFormula.buildFromArray([
      ['=42']
    ])
    engine.addNamedExpression('FOO', '=Sheet1!A1 + 10', undefined)

    engine.removeSheet('Sheet1')

    expect(engine.getNamedExpressionFormula('FOO')).toEqual('=#REF! + 10')
  })

  it('local named expression shadows global one', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42', undefined)
    engine.addNamedExpression('FOO', '=13', 'Sheet1')

    engine.setCellContents(adr('A1'), '=FOO+10')

    const localFooVertex = engine.dependencyGraph.namedExpressionVertex('FOO', 0)!
    const globalFooVertex = engine.dependencyGraph.fetchCell(engine.dependencyGraph.namedExpressions.namedExpressionForScope('FOO', undefined)!.address)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(23)
  })

  it('removing local named expression binds all the edges to global one', () => {
    const engine = HyperFormula.buildFromArray([[]])
    engine.addNamedExpression('foo', '10', undefined)
    engine.addNamedExpression('foo', '20', 'Sheet1')
    engine.setCellContents(adr('A1'), [['=foo']])
    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const globalFooVertex = namedExpressionVertex(engine, 'foo', undefined)

    engine.removeNamedExpression('foo', 'Sheet1')

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(false)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })

  it('removing local named expression binds all the edges to global one even if it doesnt exist', () => {
    const engine = HyperFormula.buildFromArray([[]])
    engine.addNamedExpression('foo', '20', 'Sheet1')
    engine.setCellContents(adr('A1'), [['=foo']])
    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)

    engine.removeNamedExpression('foo', 'Sheet1')

    const globalFooVertex = namedExpressionVertex(engine, 'foo', undefined)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(false)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('adding local named expression binds all the edges from global one', () => {
    const engine = HyperFormula.buildFromArray([[]])
    engine.addNamedExpression('foo', '20', undefined)
    engine.setCellContents(adr('A1'), [['=foo']])
    const globalFooVertex = namedExpressionVertex(engine, 'foo', undefined)

    engine.addNamedExpression('foo', '30', 'Sheet1')

    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(30)
  })
})
