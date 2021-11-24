import {ExportedCellChange, ExportedNamedExpressionChange, HyperFormula, NoSheetWithIdError} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {ErrorType} from '../src/Cell'
import {Vertex} from '../src/DependencyGraph/Vertex'
import {ErrorMessage} from '../src/error-message'
import {NoRelativeAddressesAllowedError} from '../src/errors'
import {adr, detailedError} from './testUtils'

describe('Named expressions - checking if its possible', () => {
  it('should be possible to add named expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '1')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', 'foo')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', null)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!$A$1')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!$A$1', 0)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('_A', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('A', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('Aa', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('B.', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo_bar', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('A...', 1)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('B___', 1)).toBe(true)
  })

  it('no if expression name invalid', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('A1', 'foo')).toBe(false)
  })

  it('no if scope does not exists', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A1', 1)).toBe(false)
  })

  it('no if trying to add formula with relative references', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A$1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=$A1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!A1:A2')).toBe(false)
  })

  it('should be possible to remove named expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('foo', 'foo')
    await engine.addNamedExpression('bar', 'bar', 0)
    expect(engine.isItPossibleToRemoveNamedExpression('foo')).toBe(true)
    expect(engine.isItPossibleToRemoveNamedExpression('bar', 0)).toBe(true)
  })

  it('no if trying to remove not existing expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToRemoveNamedExpression('foo')).toBe(false)
  })

  it('no if trying to remove named expression from not existing scope', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToRemoveNamedExpression('foo', 1)).toBe(false)
  })

  it('should be possible to change named expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('foo', 'foo')
    await engine.addNamedExpression('bar', 'bar', 0)
    expect(engine.isItPossibleToChangeNamedExpression('foo', 'bar')).toBe(true)
    expect(engine.isItPossibleToChangeNamedExpression('bar', 'baz', 0)).toBe(true)
  })

  it('no if trying to change to formula with relative references', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('foo', 'foo')
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A$1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=$A1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=Sheet1!A1:A2')).toBe(false)
  })

  it('no if trying to change named expression in not existing scope', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A1', 1)).toBe(false)
  })

  it('no if trying to change not existing expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToChangeNamedExpression('foo', 'foo')).toBe(false)
  })
})

describe('Named expressions - absolute references only', () => {
  it('adding named expression allows only for absolute addresses', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(async() => {
      await engine.addNamedExpression('foo', '=A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=Sheet1!A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=$A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=Sheet1!$A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=Sheet1!A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=Sheet1!A1:A2')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(async() => {
      await engine.addNamedExpression('foo', '=Sheet1!A:B')
    }).toThrow(new NoRelativeAddressesAllowedError())
  })

  it('changing named expression allows only for absolute addresses', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.addNamedExpression('foo', 'foo')

    expect(() => {
      engine.changeNamedExpression('foo', '=A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=Sheet1!A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=$A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=Sheet1!$A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=Sheet1!A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=Sheet1!A1:A2')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.changeNamedExpression('foo', '=Sheet1!A:B')
    }).toThrow(new NoRelativeAddressesAllowedError())
  })
})

describe('Named expressions - store manipulation', () => {
  it('basic usage with global named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    expect(engine.getNamedExpressionValue('myName')).toEqual(52)
  })

  it('using string expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', 'foobarbaz')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 'foobarbaz')])
    expect(engine.getNamedExpressionValue('myName')).toEqual('foobarbaz')
  })

  it('using number expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', '42')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using empty expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', null)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', null)])
    expect(engine.getNamedExpressionValue('myName')).toBe(null)
  })

  it('using native number as expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', 42)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', 42)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
  })

  it('using native boolean as expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', true)

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', true)])
    expect(engine.getNamedExpressionValue('myName')).toEqual(true)
  })

  it('using error expression', async() => {
const engine = await HyperFormula.buildEmpty()

    const changes = await engine.addNamedExpression('myName', '#VALUE!')

    expect(changes).toEqual([new ExportedNamedExpressionChange('myName', detailedError(ErrorType.VALUE))])
    expect(engine.getNamedExpressionValue('myName')).toEqualError(detailedError(ErrorType.VALUE))
  })

  it('works for more formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    await engine.addNamedExpression('myName.1', '=Sheet1!$A$1+10')
    await engine.addNamedExpression('myName.2', '=Sheet1!$A$1+11')

    expect(engine.getNamedExpressionValue('myName.1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName.2')).toEqual(53)
  })

  it('adding the same named expression twice on global level is forbidden', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    expect(async() => {
      await engine.addNamedExpression('myName', '=Sheet1!A1+10')
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('adding the same named expression twice on local level is forbidden', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10', 0)

    expect(async() => {
      await engine.addNamedExpression('myName', '=Sheet1!A1+10', 0)
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('named expressions is validated when added', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(async() => {
      await engine.addNamedExpression('1definitelyIncorrectName', '=42')
    }).toThrowError('Name of Named Expression \'1definitelyIncorrectName\' is invalid')
  })

  it('when adding named expression, matrix formulas are not accepted', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(async() => {
      await engine.addNamedExpression('myName', '=TRANSPOSE(A1:B2)')
    }).toThrowError(/Relative addresses not allowed in named expressions./)
  })

  it('retrieving non-existing named expression', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(engine.getNamedExpressionValue('nonExistentNameExpression')).toBe(undefined)
    expect(engine.getNamedExpressionFormula('nonExistentNameExpression')).toBe(undefined)
  })

  it('removing named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1')

    await engine.removeNamedExpression('myName')

    expect(engine.getNamedExpressionValue('myName')).toBe(undefined)
    expect((await engine.setCellContents(adr('A1'), '43')).length).toBe(1)
  })

  it('removing local named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '13')
    await engine.addNamedExpression('myName', '=Sheet1!$A$1', 0)

    await engine.removeNamedExpression('myName', 0)

    expect(engine.getNamedExpressionValue('myName', 0)).toBe(undefined)
    expect(engine.getNamedExpressionValue('myName')).toBe(13)
  })

  it('is possible to change named expression formula to other', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    engine.changeNamedExpression('myName', '=Sheet1!$A$1+11')

    expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })

  it('is possible to change named expression formula to other expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    engine.changeNamedExpression('myName', 58)

    expect(engine.getNamedExpressionValue('myName')).toEqual(58)
  })

  it('is possible to change named expression formula on local level', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '=100', 0)

    engine.changeNamedExpression('myName', '=200', 0)

    expect(engine.getNamedExpressionValue('myName', 0)).toEqual(200)
  })

  it('when changing named expression, matrices are not supported', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('myName', '=42')

    expect(() => {
      engine.changeNamedExpression('myName', '=TRANSPOSE(A1:B2)')
    }).toThrowError(/Relative addresses not allowed in named expressions./)
  })

  it('changing not existing named expression', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', '=42')
    }).toThrowError('Named Expression \'myName\' does not exist')
  })

  it('changing named expression from non existing sheet', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', '=42', 1)
    }).toThrowError(NoSheetWithIdError)
  })

  it('listing named expressions', async() => {
const engine = await HyperFormula.buildEmpty()
    await engine.addNamedExpression('myName.1', '=42')
    await engine.addNamedExpression('myName.2', '=42')

    const namedExpressions = engine.listNamedExpressions()

    expect(namedExpressions).toEqual([
      'myName.1',
      'myName.2',
    ])
  })

  it('listing scoped named expressions', async() => {
const engine = await HyperFormula.buildFromSheets({sheet1: [], sheet2: []})
    await engine.addNamedExpression('myName.1', '=42', 0)
    await engine.addNamedExpression('myName.2', '=42', 1)

    const namedExpressions = engine.listNamedExpressions(1)

    expect(namedExpressions).toEqual([
      'myName.2',
    ])
  })

  it('adding named expressions is case insensitive', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('myName', '=42')

    expect(engine.getNamedExpressionValue('MYname')).toEqual(42)
    expect(() => {
      engine.changeNamedExpression('MYname', '=43')
    }).not.toThrowError()
    expect(async() => {
      await engine.removeNamedExpression('MYname')
    }).not.toThrowError()
  })

  it('allow even 255 character named expressions', async() => {
const engine = await HyperFormula.buildEmpty()

    const longExpressionName = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

    expect(longExpressionName.length).toBe(255)
    expect(async() => {
      await engine.addNamedExpression(longExpressionName, '=42')
    }).not.toThrowError()
  })

  it('validates characters which are allowed in name', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(async() => await engine.addNamedExpression('1CantStartWithNumber', '=42')).toThrowError(/Name .* is invalid/)
    expect(async() => await engine.addNamedExpression('Spaces Are Not Allowed', '=42')).toThrowError(/Name .* is invalid/)
    expect(async() => await engine.addNamedExpression('.CantStartWithDot', '=42')).toThrowError(/Name .* is invalid/)
    expect(async() => await engine.addNamedExpression('_CanStartWithUnderscore', '=42')).not.toThrowError()
    expect(async() => await engine.addNamedExpression('dots.are.fine', '=42')).not.toThrowError()
    expect(async() => await engine.addNamedExpression('underscores_are_fine', '=42')).not.toThrowError()
    expect(async() => await engine.addNamedExpression('ś.zażółć.gęślą.jaźń.unicode.is.fine', '=42')).not.toThrowError()
    expect(async() => await engine.addNamedExpression('If.It.Only.Has.Something.Like.Reference.Not.In.Beginning.Then.Its.Ok.A100', '=42')).not.toThrowError()
    expect(async() => await engine.addNamedExpression('A100', '=42')).toThrowError(/Name .* is invalid/)
    expect(async() => await engine.addNamedExpression('$A$50', '=42')).toThrowError(/Name .* is invalid/)
    expect(async() => await engine.addNamedExpression('SheetName!$A$50', '=42')).toThrowError(/Name .* is invalid/)
  })

  it('#getNamedExpressionFormula when it exists', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.addNamedExpression('myName.1', '=Sheet1!$A$1+10')

    expect(engine.getNamedExpressionFormula('myName.1')).toEqual('=Sheet1!$A$1+10')
  })

  it('#getNamedExpressionFormula when there is no such named expression', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(engine.getNamedExpressionFormula('not.existing')).toBeUndefined()
  })

  it('#getNamedExpressionFormula when named expression is not formula', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.addNamedExpression('myName.1', '42')

    expect(engine.getNamedExpressionFormula('myName.1')).toBeUndefined()
  })

  it('#getNamedExpressionFormula when there is no such sheet', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(() => {
      engine.getNamedExpressionFormula('myName.1', 1)
    }).toThrowError(NoSheetWithIdError)
  })

  it('local level named expressions have separate storages', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    await engine.addNamedExpression('myName', '=42')
    await engine.addNamedExpression('myName', '=13', 0)

    expect(engine.getNamedExpressionValue('myName')).toEqual(42)
    expect(engine.getNamedExpressionValue('myName', 0)).toEqual(13)
    expect(engine.getNamedExpressionFormula('myName')).toEqual('=42')
    expect(engine.getNamedExpressionFormula('myName', 0)).toEqual('=13')
  })

  it('when trying to add named expression to nonexisting sheet', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    expect(async() => {
      await engine.addNamedExpression('myName', '=13', 1)
    }).toThrowError(NoSheetWithIdError)
  })
})

const namedExpressionVertex = (engine: HyperFormula, expressionName: string, sheetId?: number): Vertex => {
  let namedExpression
  if (sheetId === undefined) {
    namedExpression = engine.dependencyGraph.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)!
  } else {
    namedExpression = engine.dependencyGraph.namedExpressions.namedExpressionForScope(expressionName, sheetId)!
  }
  return engine.dependencyGraph.fetchCell(namedExpression.address)
}

describe('Named expressions - evaluation', () => {
  it('is recomputed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])
    await engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    const changes = await engine.setCellContents(adr('A1'), '20')

    expect(changes.length).toBe(2)
    expect(changes).toContainEqual(new ExportedNamedExpressionChange('myName', 30))
    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('should reevaluate volatile function in named expression', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.addNamedExpression('volatileExpression', '=RAND()')
    const valueBeforeRecomputation = engine.getNamedExpressionValue('volatileExpression')

    const changes = await engine.setCellContents(adr('A1'), 'foo')

    const valueAfterRecomputation = engine.getNamedExpressionValue('volatileExpression')
    expect(valueAfterRecomputation).not.toEqual(valueBeforeRecomputation)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A1'), 'foo'))
    expect(changes).toContainEqual(new ExportedNamedExpressionChange('volatileExpression', valueAfterRecomputation!))
  })

  it('adds edge to dependency', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('FOO', '=42')

    await engine.setCellContents(adr('A1'), '=FOO+10')

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(fooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(52)
  })

  it('NAME error when there is no such named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FOO']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('FOO')))
  })

  it('named expression dependency works if named expression was defined later', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FOO']
    ])

    await engine.addNamedExpression('FOO', '=42')

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(fooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  it('removed named expression returns NAME error', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('FOO', '=42')
    await engine.setCellContents(adr('A1'), '=FOO+10')

    await engine.removeNamedExpression('FOO')

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('FOO')))
  })

  it('removing node dependent on named expression', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('FOO', '=42')
    await engine.setCellContents(adr('A1'), '=FOO+10')

    await engine.setCellContents(adr('A1'), null)

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
    expect(engine.graph.adjacentNodes(fooVertex).size).toBe(0)
  })

  it('named expressions are transformed during CRUDs', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=42']
    ])
    await engine.addNamedExpression('FOO', '=Sheet1!$A$1 + 10')

    await engine.removeSheet(0)

    expect(engine.getNamedExpressionFormula('FOO')).toEqual('=#REF! + 10')
  })

  it('local named expression shadows global one', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('FOO', '=42')
    await engine.addNamedExpression('FOO', '=13', 0)

    await engine.setCellContents(adr('A1'), '=FOO+10')

    const localFooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)!
    const globalFooVertex = engine.dependencyGraph.fetchCell(engine.dependencyGraph.namedExpressions.namedExpressionForScope('FOO')!.address)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(23)
  })

  it('removing local named expression binds all the edges to global one', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    await engine.addNamedExpression('foo', '10')
    await engine.addNamedExpression('foo', '20', 0)
    await engine.setCellContents(adr('A1'), [['=foo']])
    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const globalFooVertex = namedExpressionVertex(engine, 'foo')

    await engine.removeNamedExpression('foo', 0)

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(false)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })

  it('removing local named expression binds all the edges to global one even if it doesnt exist', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    await engine.addNamedExpression('foo', '20', 0)
    await engine.setCellContents(adr('A1'), [['=foo']])
    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)

    await engine.removeNamedExpression('foo', 0)

    const globalFooVertex = namedExpressionVertex(engine, 'foo')
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(false)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })

  it('adding local named expression binds all the edges from global one', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    await engine.addNamedExpression('foo', '20')
    await engine.setCellContents(adr('A1'), [['=foo']])
    const globalFooVertex = namedExpressionVertex(engine, 'foo')

    await engine.addNamedExpression('foo', '30', 0)

    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(30)
  })
})

describe('Named expressions - cross scope', () => {
  it('should be possible to refer to other sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo']],
      'Sheet2': [['bar']]
    })

    await engine.addNamedExpression('expr', '=Sheet2!$A$1', 0)

    expect(engine.getNamedExpressionValue('expr', 0)).toEqual('bar')
  })

  it('should be possible to add named expressions with same name to two different scopes', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar', '=expr']]
    })

    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)
    await engine.addNamedExpression('expr', '=Sheet2!$A$1', 1)

    expect(engine.getCellValue(adr('B1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
  })

  it('should be possible to access named expression only from its scope', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar', '=expr']]
    })

    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)

    expect(engine.getCellValue(adr('B1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('expr')))
  })

  it('should add named expression to global scope when moving formula to other sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1), adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toBe(null)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope when cut pasting formula to other sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)

    engine.cut(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toBe(null)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope when copying formula to other sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope even if cell was modified before pasting', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    await engine.setCellContents(adr('B1'), [['baz']])
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual('baz')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should use already existing named expression in other sheet when moving formula', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })

    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)
    await engine.addNamedExpression('expr', '=Sheet2!$A$1', 1)

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1), adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 1)).toEqual('=Sheet2!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toBe(null)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
    // ensure edges are correct
    const sourceScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 0)
    const targetScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 1)
    const targetFormulaVertex = engine.dependencyGraph.getCell(adr('B1', 1))!
    expect(engine.dependencyGraph.existsEdge(sourceScopeNEVertex, targetFormulaVertex)).toBe(false)
    expect(engine.dependencyGraph.existsEdge(targetScopeNEVertex, targetFormulaVertex)).toBe(true)
  })

  it('should use already existing named expression in other sheet when cut pasting formula', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)
    await engine.addNamedExpression('expr', '=Sheet2!$A$1', 1)

    engine.cut(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 1)).toEqual('=Sheet2!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toBe(null)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
    // ensure edges are correct
    const sourceScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 0)
    const targetScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 1)
    const targetFormulaVertex = engine.dependencyGraph.getCell(adr('B1', 1))!
    expect(engine.dependencyGraph.existsEdge(sourceScopeNEVertex, targetFormulaVertex)).toBe(false)
    expect(engine.dependencyGraph.existsEdge(targetScopeNEVertex, targetFormulaVertex)).toBe(true)
  })

  it('should use already existing named expression in other sheet when copying formula', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })

    await engine.addNamedExpression('expr', '=Sheet1!$A$1', 0)
    await engine.addNamedExpression('expr', '=Sheet2!$A$1', 1)

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 0)).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 1)).toEqual('=Sheet2!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
    // ensure edges are correct
    const sourceScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 0)
    const targetScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 1)
    const targetFormulaVertex = engine.dependencyGraph.getCell(adr('B1', 1))!
    expect(engine.dependencyGraph.existsEdge(sourceScopeNEVertex, targetFormulaVertex)).toBe(false)
    expect(engine.dependencyGraph.existsEdge(targetScopeNEVertex, targetFormulaVertex)).toBe(true)
  })
})

describe('Named expressions - named ranges', () => {
  it('should be possible to define simple range in named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['3'],
    ])

    await engine.addNamedExpression('fooo', '=Sheet1!$A$1:Sheet1!$A$2')
    await engine.setCellContents(adr('B1'), [['=SUM(fooo)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should be possible to define column range in named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['3'],
    ])

    await engine.addNamedExpression('fooo', '=Sheet1!$A:Sheet1!$A')
    await engine.setCellContents(adr('B1'), [['=SUM(fooo)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should recalculate when named range changes definition', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    await engine.addNamedExpression('fooo', '=Sheet1!$A:Sheet1!$A')
    await engine.setCellContents(adr('C1'), [['=SUM(fooo)']])
    engine.changeNamedExpression('fooo', '=Sheet1!$B:Sheet1!$B')

    expect(engine.getCellValue(adr('C1'))).toEqual(6)
  })

  it('should return array value of named expression', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    const changes = await engine.addNamedExpression('fooo', '=TRANSPOSE(Sheet1!$A$1:Sheet1!$B$2)')

    expect(changes).toContainEqual(new ExportedNamedExpressionChange('fooo', [[1, 3], [2, 4]]))
  })
})

describe('Named expressions - options', () => {
  it('should return named expression with empty options', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo')

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=foo',
      scope: undefined,
      options: undefined
    })
  })

  it('should return named expression with options', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'bar' })

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=foo',
      scope: undefined,
      options: {
        visible: false,
        comment: 'bar'
      }
    })
  })

  it('should preserve options after undo-redo', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'bar' })

    await engine.undo()
    await engine.redo()

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=foo',
      scope: undefined,
      options: {
        visible: false,
        comment: 'bar'
      }
    })
  })

  it('should change options of named expression', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'foo' })

    engine.changeNamedExpression('foo', '=bar', undefined, { visible: true, comment: 'bar' })

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=bar',
      scope: undefined,
      options: {
        visible: true,
        comment: 'bar'
      }
    })
  })

  it('should undo changing options of named expression', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'foo' })
    engine.changeNamedExpression('foo', '=bar', undefined, { visible: true, comment: 'bar' })

    await engine.undo()

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=foo',
      scope: undefined,
      options: {
        visible: false,
        comment: 'foo'
      }
    })
  })

  it('should undo-redo changing options of named expression', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'foo' })
    engine.changeNamedExpression('foo', '=bar', undefined, { visible: true, comment: 'bar' })

    await engine.undo()
    await engine.redo()

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=bar',
      scope: undefined,
      options: {
        visible: true,
        comment: 'bar'
      }
    })
  })

  it('should restore named expression with options', async() => {
const engine = await HyperFormula.buildEmpty()

    await engine.addNamedExpression('foo', '=foo', undefined, { visible: false, comment: 'foo' })
    await engine.removeNamedExpression('foo')

    await engine.undo()

    expect(engine.getNamedExpression('foo')).toEqual({
      name: 'foo',
      expression: '=foo',
      scope: undefined,
      options: {
        visible: false,
        comment: 'foo'
      }
    })
  })
})

describe('nested named expressions', () => {
  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([['=ABCD']])
    await engine.addNamedExpression('ABCD', '=EFGH')
    await engine.addNamedExpression('EFGH', 1)
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })
})

describe('serialization', () => {
  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
    ['42'],
    ['50'],
    ['60']])
    await engine.addNamedExpression('prettyName', '=Sheet1!$A$1+100')
    await engine.addNamedExpression('anotherPrettyName', '=Sheet1!$A$2+100')
    await engine.addNamedExpression('alsoPrettyName', '=Sheet1!$A$3+100', 0)
    expect(engine.getAllNamedExpressionsSerialized()).toEqual([
      {name: 'prettyName', expression: '=Sheet1!$A$1+100', options: undefined, scope: undefined},
      {name: 'anotherPrettyName', expression: '=Sheet1!$A$2+100', options: undefined, scope: undefined},
      {name: 'alsoPrettyName', expression: '=Sheet1!$A$3+100', options: undefined, scope: 0}
    ])
  })

  it('should update scopes', async() => {
const engine = await HyperFormula.buildFromSheets({sheet1: [[]], sheet2: [[]], sheet3: [[]]})
    await engine.addNamedExpression('prettyName', '=1', 0)
    await engine.addNamedExpression('anotherPrettyName', '=2', 1)
    await engine.addNamedExpression('alsoPrettyName', '=3', 2)
    await engine.removeSheet(1)
    expect(engine.getAllNamedExpressionsSerialized()).toEqual([
      {name: 'prettyName', expression: '=1', scope: 0, options: undefined},
      {name: 'alsoPrettyName', expression: '=3', scope: 1, options: undefined}
    ])
  })
})
