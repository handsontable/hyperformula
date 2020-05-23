import {HyperFormula, ExportedNamedExpressionChange, EmptyValue, ExportedCellChange} from '../src'
import {adr, detailedError} from './testUtils'
import {ErrorType} from '../src/Cell'
import {NoRelativeAddressesAllowedError, NoSheetWithNameError} from '../src/errors'
import {Vertex} from '../src/DependencyGraph/Vertex'

describe('Named expressions - checking if its possible', () => {
  it('should be possible to add named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '1')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', 'foo')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', null)).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!$A$1')).toBe(true)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!$A$1', 'Sheet1')).toBe(true)
  })

  it('no if expression name invalid', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('A1', 'foo')).toBe(false)
  })

  it('no if scope does not exists', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A1', 'Sheet2')).toBe(false)
  })

  it('no if trying to add formula with relative references', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=A$1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=$A1')).toBe(false)
    expect(engine.isItPossibleToAddNamedExpression('foo', '=Sheet1!A1:A2')).toBe(false)
  })

  it('should be possible to remove named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    engine.addNamedExpression('bar', 'bar', 'Sheet1')
    expect(engine.isItPossibleToRemoveNamedExpression('foo')).toBe(true)
    expect(engine.isItPossibleToRemoveNamedExpression('bar', 'Sheet1')).toBe(true)
  })

  it('no if trying to remove not existing expression', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToRemoveNamedExpression('foo')).toBe(false)
  })

  it('no if trying to remove named expression from not existing scope', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToRemoveNamedExpression('foo', 'Sheet2')).toBe(false)
  })

  it('should be possible to change named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    engine.addNamedExpression('bar', 'bar', 'Sheet1')
    expect(engine.isItPossibleToChangeNamedExpression('foo', 'bar')).toBe(true)
    expect(engine.isItPossibleToChangeNamedExpression('bar', 'baz', 'Sheet1')).toBe(true)
  })

  it('no if trying to change to formula with relative references', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A$1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=$A1')).toBe(false)
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=Sheet1!A1:A2')).toBe(false)
  })

  it('no if trying to change named expression in not existing scope', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToChangeNamedExpression('foo', '=A1', 'Sheet2')).toBe(false)
  })

  it('no if trying to change not existing expression', () => {
    const engine = HyperFormula.buildFromArray([])
    expect(engine.isItPossibleToChangeNamedExpression('foo', 'foo')).toBe(false)
  })
})

describe('Named expressions - absolute references only', () => {
  it('adding named expression allows only for absolute addresses', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(() => {
      engine.addNamedExpression('foo', '=A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=Sheet1!A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=$A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=Sheet1!$A1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=Sheet1!A$1')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=Sheet1!A1:A2')
    }).toThrow(new NoRelativeAddressesAllowedError())
    expect(() => {
      engine.addNamedExpression('foo', '=Sheet1!A:B')
    }).toThrow(new NoRelativeAddressesAllowedError())
  })

  it('changing named expression allows only for absolute addresses', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('foo', 'foo')

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
  it('basic usage with global named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

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

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName.1', '=Sheet1!$A$1+10')
    engine.addNamedExpression('myName.2', '=Sheet1!$A$1+11')

    expect(engine.getNamedExpressionValue('myName.1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName.2')).toEqual(53)
  })

  it('adding the same named expression twice on global level is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10')
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('adding the same named expression twice on local level is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!$A$1+10', 'Sheet1')

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10', 'Sheet1')
    }).toThrowError('Name of Named Expression \'myName\' is already present')
  })

  it('named expressions is validated when added', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('1definitelyIncorrectName', '=42')
    }).toThrowError('Name of Named Expression \'1definitelyIncorrectName\' is invalid')
  })

  it('when adding named expression, matrix formulas are not accepted', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.addNamedExpression('myName', '{=TRANSPOSE(A1:B2)}')
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
    engine.addNamedExpression('myName', '=Sheet1!$A$1')

    engine.removeNamedExpression('myName')

    expect(engine.getNamedExpressionValue('myName')).toBe(undefined)
    expect(engine.setCellContents(adr('A1'), '43').length).toBe(1)
  })

  it('removing local named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '13')
    engine.addNamedExpression('myName', '=Sheet1!$A$1', 'Sheet1')

    engine.removeNamedExpression('myName', 'Sheet1')

    expect(engine.getNamedExpressionValue('myName', 'Sheet1')).toBe(undefined)
    expect(engine.getNamedExpressionValue('myName')).toBe(13)
  })

  it('is possible to change named expression formula to other', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    engine.changeNamedExpression('myName', '=Sheet1!$A$1+11')

    expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })

  it('is possible to change named expression formula to other expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    engine.changeNamedExpression('myName', 58)

    expect(engine.getNamedExpressionValue('myName')).toEqual(58)
  })

  it('is possible to change named expression formula on local level', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=100', 'Sheet1')

    engine.changeNamedExpression('myName', '=200', 'Sheet1')

    expect(engine.getNamedExpressionValue('myName', 'Sheet1')).toEqual(200)
  })

  it('when changing named expression, matrices are not supported', () => {
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
    }).toThrowError('Named Expression \'myName\' does not exist')
  })

  it('changing named expression from non existing sheet', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.changeNamedExpression('myName', '=42', 'NonExistingSheet')
    }).toThrowError(NoSheetWithNameError)
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

  it('#getNamedExpressionFormula when it exists', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('myName.1', '=Sheet1!$A$1+10')

    expect(engine.getNamedExpressionFormula('myName.1')).toEqual('=Sheet1!$A$1+10')
  })

  it('#getNamedExpressionFormula when there is no such named expression', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.getNamedExpressionFormula('not.existing')).toBeUndefined()
  })

  it('#getNamedExpressionFormula when named expression is not formula', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('myName.1', '42')

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

    engine.addNamedExpression('myName', '=42')
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

const namedExpressionVertex = (engine: HyperFormula, expressionName: string, sheetId: number | undefined = undefined): Vertex => {
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
    engine.addNamedExpression('myName', '=Sheet1!$A$1+10')

    const changes = engine.setCellContents(adr('A1'), '20')

    expect(changes.length).toBe(2)
    expect(changes).toContainEqual(new ExportedNamedExpressionChange('myName', 30))
    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('should reevaluate volatile function in named expression', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.addNamedExpression('volatileExpression', '=RAND()')
    const valueBeforeRecomputation = engine.getNamedExpressionValue('volatileExpression')

    const changes = engine.setCellContents(adr('A1'), 'foo')

    const valueAfterRecomputation = engine.getNamedExpressionValue('volatileExpression')
    expect(valueAfterRecomputation).not.toEqual(valueBeforeRecomputation)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A1'), 'foo'))
    expect(changes).toContainEqual(new ExportedNamedExpressionChange('volatileExpression', valueAfterRecomputation!))
  })

  it('adds edge to dependency', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42')

    engine.setCellContents(adr('A1'), '=FOO+10')

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
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

    engine.addNamedExpression('FOO', '=42')

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(fooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  it('removed named expression returns NAME error', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42')
    engine.setCellContents(adr('A1'), '=FOO+10')

    engine.removeNamedExpression('FOO')

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('removing node dependent on named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42')
    engine.setCellContents(adr('A1'), '=FOO+10')

    engine.setCellContents(adr('A1'), null)

    const fooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)
    expect(engine.graph.adjacentNodes(fooVertex).size).toBe(0)
  })

  it('named expressions are transformed during CRUDs', () => {
    const engine = HyperFormula.buildFromArray([
      ['=42']
    ])
    engine.addNamedExpression('FOO', '=Sheet1!$A$1 + 10')

    engine.removeSheet('Sheet1')

    expect(engine.getNamedExpressionFormula('FOO')).toEqual('=#REF! + 10')
  })

  it('local named expression shadows global one', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('FOO', '=42')
    engine.addNamedExpression('FOO', '=13', 'Sheet1')

    engine.setCellContents(adr('A1'), '=FOO+10')

    const localFooVertex = engine.dependencyGraph.fetchNamedExpressionVertex('FOO', 0)!
    const globalFooVertex = engine.dependencyGraph.fetchCell(engine.dependencyGraph.namedExpressions.namedExpressionForScope('FOO')!.address)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(23)
  })

  it('removing local named expression binds all the edges to global one', () => {
    const engine = HyperFormula.buildFromArray([[]])
    engine.addNamedExpression('foo', '10')
    engine.addNamedExpression('foo', '20', 'Sheet1')
    engine.setCellContents(adr('A1'), [['=foo']])
    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const globalFooVertex = namedExpressionVertex(engine, 'foo')

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

    const globalFooVertex = namedExpressionVertex(engine, 'foo')
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(false)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('adding local named expression binds all the edges from global one', () => {
    const engine = HyperFormula.buildFromArray([[]])
    engine.addNamedExpression('foo', '20')
    engine.setCellContents(adr('A1'), [['=foo']])
    const globalFooVertex = namedExpressionVertex(engine, 'foo')

    engine.addNamedExpression('foo', '30', 'Sheet1')

    const localFooVertex = namedExpressionVertex(engine, 'foo', 0)
    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    expect(engine.graph.existsEdge(localFooVertex, a1)).toBe(true)
    expect(engine.graph.existsEdge(globalFooVertex, a1)).toBe(false)
    expect(engine.getCellValue(adr('A1'))).toEqual(30)
  })
})

describe('Named expressions - cross scope', () => {
  it('should be possible to refer to other sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo']],
      'Sheet2': [['bar']]
    })

    engine.addNamedExpression('expr', '=Sheet2!$A$1', 'Sheet1')

    expect(engine.getNamedExpressionValue('expr', 'Sheet1')).toEqual('bar')
  })

  it('should be possible to add named expressions with same name to two different scopes', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar', '=expr']]
    })

    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')
    engine.addNamedExpression('expr', '=Sheet2!$A$1', 'Sheet2')

    expect(engine.getCellValue(adr('B1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
  })

  it('should be possible to access named expression only from its scope', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar', '=expr']]
    })

    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')

    expect(engine.getCellValue(adr('B1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual(detailedError(ErrorType.NAME))
  })

  it('should add named expression to global scope when moving formula to other sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')

    engine.moveCells(adr('B1'), 1, 1, adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope when cut pasting formula to other sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')

    engine.cut(adr('B1'), 1, 1)
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope when copying formula to other sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')

    engine.copy(adr('B1'), 1, 1)
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual('foo')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should add named expression to global scope even if cell was modified before pasting', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')

    engine.copy(adr('B1'), 1, 1)
    engine.setCellContents(adr('B1'), [['baz']])
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr')).toEqual('=Sheet1!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual('baz')
    expect(engine.getCellValue(adr('B1', 1))).toEqual('foo')
  })

  it('should use already existing named expression in other sheet when moving formula', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })

    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')
    engine.addNamedExpression('expr', '=Sheet2!$A$1', 'Sheet2')

    engine.moveCells(adr('B1'), 1, 1, adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 'Sheet2')).toEqual('=Sheet2!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
    // ensure edges are correct
    const sourceScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 0)
    const targetScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 1)
    const targetFormulaVertex = engine.dependencyGraph.getCell(adr('B1', 1))!
    expect(engine.dependencyGraph.existsEdge(sourceScopeNEVertex, targetFormulaVertex)).toBe(false)
    expect(engine.dependencyGraph.existsEdge(targetScopeNEVertex, targetFormulaVertex)).toBe(true)
  })

  it('should use already existing named expression in other sheet when cut pasting formula', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })


    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')
    engine.addNamedExpression('expr', '=Sheet2!$A$1', 'Sheet2')

    engine.cut(adr('B1'), 1, 1)
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 'Sheet2')).toEqual('=Sheet2!$A$1')
    expect(engine.getCellValue(adr('B1', 0))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B1', 1))).toEqual('bar')
    // ensure edges are correct
    const sourceScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 0)
    const targetScopeNEVertex = engine.dependencyGraph.fetchNamedExpressionVertex('expr', 1)
    const targetFormulaVertex = engine.dependencyGraph.getCell(adr('B1', 1))!
    expect(engine.dependencyGraph.existsEdge(sourceScopeNEVertex, targetFormulaVertex)).toBe(false)
    expect(engine.dependencyGraph.existsEdge(targetScopeNEVertex, targetFormulaVertex)).toBe(true)
  })

  it('should use already existing named expression in other sheet when copying formula', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['foo', '=expr']],
      'Sheet2': [['bar']]
    })

    engine.addNamedExpression('expr', '=Sheet1!$A$1', 'Sheet1')
    engine.addNamedExpression('expr', '=Sheet2!$A$1', 'Sheet2')

    engine.copy(adr('B1'), 1, 1)
    engine.paste(adr('B1', 1))

    expect(engine.getNamedExpressionFormula('expr')).toEqual(undefined)
    expect(engine.getNamedExpressionFormula('expr', 'Sheet1')).toEqual('=Sheet1!$A$1')
    expect(engine.getNamedExpressionFormula('expr', 'Sheet2')).toEqual('=Sheet2!$A$1')
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
  it('should be possible to define simple range in named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['3'],
    ])

    engine.addNamedExpression('fooo', '=Sheet1!$A$1:Sheet1!$A$2')
    engine.setCellContents(adr('B1'), [['=SUM(fooo)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should be possible to define column range in named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['3'],
    ])

    engine.addNamedExpression('fooo', '=Sheet1!$A:Sheet1!$A')
    engine.setCellContents(adr('B1'), [['=SUM(fooo)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should recalculate when named range changes definition', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    engine.addNamedExpression('fooo', '=Sheet1!$A:Sheet1!$A')
    engine.setCellContents(adr('C1'), [['=SUM(fooo)']])
    engine.changeNamedExpression('fooo', '=Sheet1!$B:Sheet1!$B')

    expect(engine.getCellValue(adr('C1'))).toEqual(6)
  })
})