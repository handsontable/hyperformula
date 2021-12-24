import {CellError, EvaluationSuspendedError, ExportedCellChange, ExportedNamedExpressionChange, HyperFormula, SimpleRangeValue} from '../src'
import {ArraySize} from '../src/ArraySize'
import {ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
import {Events} from '../src/Emitter'
import {ErrorMessage} from '../src/error-message'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {AsyncInternalScalarValue} from '../src/interpreter/InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {AsyncSimpleRangeValue} from '../src/interpreter/SimpleRangeValue'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError, detailedErrorWithOrigin, expectEngineToBeTheSameAs} from './testUtils'

class AsyncPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AsyncPlugin> {
  public static implementedFunctions = {
    'ASYNC_FOO': {
      method: 'asyncFoo',
      isAsyncMethod: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'ASYNC_ARRAY_FOO': {
      method: 'asyncArrayFoo',
      arraySizeMethod: 'asyncArrayFooSize',
      isAsyncMethod: true,
    },
    'LONG_ASYNC_FOO': {
      method: 'longAsyncFoo',
      isAsyncMethod: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'TIMEOUT_FOO': {
      method: 'timeoutFoo',
      isAsyncMethod: true,
    },
    'ASYNC_ERROR_FOO': {
      method: 'asyncErrorFoo',
      isAsyncMethod: true,
    },
  }

  public static translations = {
    'enGB': {
      'ASYNC_FOO': 'ASYNC_FOO',
      'ASYNC_ARRAY_FOO': 'ASYNC_ARRAY_FOO',
      'LONG_ASYNC_FOO': 'LONG_ASYNC_FOO',
      'TIMEOUT_FOO': 'TIMEOUT_FOO',
      'ASYNC_ERROR_FOO': 'ASYNC_ERROR_FOO'
    },
  }

  public async asyncFoo(ast: ProcedureAst, state: InterpreterState): AsyncInternalScalarValue {
    return new Promise(resolve => setTimeout(() => {
      if (ast.args[0]) {
        const argument = this.evaluateAst(ast.args[0], state)

        resolve(argument as number + 5)

        return
      }
  
      resolve(1)
    }, 100))
  }

  public asyncArrayFoo(_ast: ProcedureAst, _state: InterpreterState): AsyncSimpleRangeValue {
    return new Promise(resolve => setTimeout(() => {
      resolve(SimpleRangeValue.onlyValues([[1, 1], [1, 1]]))
    }, 100))
  }

  public asyncArrayFooSize(ast: ProcedureAst, state: InterpreterState) {
    if (!state.formulaVertex) {
      return ArraySize.error()
    }

    const cellValue = (state.formulaVertex).getCellValue() as SimpleRangeValue

    return new ArraySize(cellValue.width(), cellValue.height())
  }
  
  public async longAsyncFoo(ast: ProcedureAst, state: InterpreterState): AsyncInternalScalarValue {
    return new Promise(resolve => setTimeout(() => {
      const argument = this.evaluateAst(ast.args[0], state)

      if (argument instanceof CellError) {
        resolve(argument)

        return
      }
      
      resolve(argument as number + ' longAsyncFoo')
    }, 3000))
  }

  public async timeoutFoo(_ast: ProcedureAst, _state: InterpreterState): AsyncInternalScalarValue {
    return new Promise(resolve => setTimeout(() => resolve('timeoutFoo'), Config.defaultConfig.timeoutTime + 10000))
  }

  public async asyncErrorFoo(_ast: ProcedureAst, _state: InterpreterState): AsyncInternalScalarValue {
    return new Promise(() => {
      throw new Error('asyncErrorFoo')
    })
  }
}

const getLoadingError = (address: string) => detailedErrorWithOrigin(ErrorType.LOADING, address, ErrorMessage.FunctionLoading)

describe('async functions', () => {
  beforeEach(() => {
    HyperFormula.registerFunctionPlugin(AsyncPlugin, AsyncPlugin.translations)
  })
  
  afterEach(() => {
    HyperFormula.unregisterFunctionPlugin(AsyncPlugin)
  })

  describe('arrays', () => {
    it('with arrayformula', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([[1, 2, '=ASYNC_FOO(A1)'], ['=ARRAYFORMULA(SUM(A1:C1))']])

      await promise

      expect(engine.getCellValue(adr('A2'))).toEqual(9)  
    })

    it('array parsing', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([['={ASYNC_FOO(),2;3,ASYNC_FOO()}']])

      expect(engine.getSheetValues(0)).toEqual([[getLoadingError('Sheet1!A1'), 2], [3, getLoadingError('Sheet1!A1')]])

      await promise

      expect(engine.getSheetValues(0)).toEqual([[1, 2], [3, 1]])
    })

    it('custom array', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([['=ASYNC_ARRAY_FOO()']])

      expect(engine.getSheetValues(0)).toEqual([[getLoadingError('Sheet1!A1')]])

      await promise

      expect(engine.getSheetValues(0)).toEqual([[1, 1], [1, 1]])
    })
  })

  describe('operations', () => {
    it('plus op', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([
        [1, '=ASYNC_FOO()+ASYNC_FOO(A1)'],
      ])
  
      expect(engine.getSheetValues(0)).toEqual([[1, getLoadingError('Sheet1!B1')]])
  
      await promise
  
      expect(engine.getSheetValues(0)).toEqual([[1, 7]])
    })

    it('nested cell reference op', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([
        ['=ASYNC_FOO() / 10'],
        ['=A1+1']
      ])
    
      await promise
  
      expect(engine.getSheetValues(0)).toEqual([[.1], [1.1]])
    })

    it.only('async functions operations on dependent async value', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([[
        '=ASYNC_FOO()', '=ASYNC_FOO()+A1'
      ]])
  
      await promise
  
      expect(engine.getSheetValues(0)).toEqual([[
        1, 2
      ]])
    })  

    it('unary minus op', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([
        [1, '=-ASYNC_FOO()'],
      ])
  
      expect(engine.getSheetValues(0)).toEqual([[1, getLoadingError('Sheet1!B1')]])
  
      await promise
  
      expect(engine.getSheetValues(0)).toEqual([[1, -1]])
    })
  })

  describe('recompute partial formulas', () => {
    it('async values are calculated after promises resolve', async() => {
      const [engine] = HyperFormula.buildFromArray([])

      const [, promise] = engine.setSheetContent(0, [[1, '=ASYNC_FOO()', '=SUM(A1:B1)', '=ASYNC_FOO(A1)']])

      expect(engine.getSheetValues(0)).toEqual([[1, getLoadingError('Sheet1!B1'), getLoadingError('Sheet1!B1'), getLoadingError('Sheet1!D1')]])

      const asyncChanges = await promise

      expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 6]])
      expect(asyncChanges).toEqual([new ExportedCellChange(adr('C1'), 2), new ExportedCellChange(adr('B1'), 1), new ExportedCellChange(adr('D1'), 6)])
    })

    it('asyncValuesUpdated fires once per public async action', async() => {
      const [engine] = HyperFormula.buildFromArray([])
      const handler = jasmine.createSpy()

      engine.on(Events.AsyncValuesUpdated, handler)

      await engine.setSheetContent(0, [['=ASYNC_FOO()']])[1]

      expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 1)])

      await engine.setSheetContent(0, [['=ASYNC_FOO()', '=ASYNC_FOO()', '=ASYNC_FOO()']])[1]

      expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 1), new ExportedCellChange(adr('B1'), 1), new ExportedCellChange(adr('C1'), 1)])
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })    

  describe('recompute all formulas', () => {
    it('async values are calculated after promises resolve', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([
        ['=ASYNC_FOO()', '=ASYNC_FOO(A1)', '=A1 + B1'],
        ['=ASYNC_FOO()', '=ASYNC_FOO(A2)'],
      ])

      expect(engine.getSheetValues(0)).toEqual([
        [getLoadingError('Sheet1!A1'), getLoadingError('Sheet1!B1'), getLoadingError('Sheet1!A1')],
        [getLoadingError('Sheet1!A2'), getLoadingError('Sheet1!B2')]
      ])

      await promise

      expect(engine.getSheetValues(0)).toEqual([[1, 6, 7], [1, 6]])
    })

    it('should return #TIMEOUT error if function does not resolve due to the request taking too long', async() => {
      const [engine, promise] = HyperFormula.buildFromArray([
        ['=TIMEOUT_FOO()', 'foo'],
      ])

      await promise

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.TIMEOUT, ErrorMessage.FunctionTimeout))
      expect(engine.getCellValue(adr('B1'))).toBe('foo')
    }, Config.defaultConfig.timeoutTime + 3000)

    it('should throw an error if function does not resolve', async() => {      
      const [, promise] = HyperFormula.buildFromArray([
        ['=ASYNC_ERROR_FOO()'],
      ])

      try {
        await promise
      } catch (error) {
        expect(error).toEqualError(new Error('asyncErrorFoo'))
      }
    })
  })

  it('rebuildAndRecalculate', async() => {
    const [engine, promise] = HyperFormula.buildFromArray([
      ['=ASYNC_FOO()+2'],
    ])

    await promise

    await engine.rebuildAndRecalculate()

    expect(engine.getSheetValues(0)).toEqual([[3]])
  })

  it('handles promise races gracefully', async() => {
    const [engine, enginePromise] = HyperFormula.buildFromArray([[
      'foo', '=LONG_ASYNC_FOO(A1)'
    ]])

    const [, cellContentPromise] = engine.setCellContents(adr('A1'), '=ASYNC_FOO()')

    expect(engine.getSheetValues(0)).toEqual([[getLoadingError('Sheet1!A1'), getLoadingError('Sheet1!B1')]])

    await Promise.all([
      enginePromise,
      cellContentPromise
    ])

    expect(engine.getSheetValues(0)).toEqual([[1, '1 longAsyncFoo']])
  })

  it('works with multiple async functions one after another', async() => {
    const sheet = [[
      1, '=ASYNC_FOO()'
    ]]
    const [engine] = HyperFormula.buildFromArray(sheet)

    const [,promise] = engine.setSheetContent(0, [[
      '=ASYNC_FOO()', 1
    ]])

    await promise

    expect(engine.getSheetValues(0)).toEqual([[
      1, 1
    ]])
  })

  it('async value recalculated when dependency changes', async() => {
    const sheet = [[
      1, '=ASYNC_FOO(A1)'
    ]]
    const [engine, promise] = HyperFormula.buildFromArray(sheet)

    await promise
    await engine.setCellContents(adr('A1'), 5)[1]

    expect(engine.getSheetValues(0)).toEqual([[
      5, 10
    ]])
  })

  it('named expressions works with async functions', async() => {
    const [engine] = HyperFormula.buildEmpty()
    const [changes, promise] = engine.addNamedExpression('asyncFoo', '=ASYNC_FOO()')

    expect(changes).toEqual([new ExportedNamedExpressionChange('asyncFoo', getLoadingError('asyncFoo'))])
    expect(engine.getNamedExpressionValue('asyncFoo')).toEqual(getLoadingError('asyncFoo'))

    const asyncChanges = await promise

    expect(engine.getNamedExpressionValue('asyncFoo')).toEqual(1)
    expect(asyncChanges).toEqual([new ExportedNamedExpressionChange('asyncFoo', 1)])
  })

  it('calculateFormula works with async functions', async() => {
    const [engine] = HyperFormula.buildFromArray([[
      1
    ]])
    
    const [cellValue, promise] = engine.calculateFormula('=ASYNC_FOO(A1)', 0)

    expect(cellValue).toEqual(detailedError(ErrorType.LOADING, ErrorMessage.FunctionLoading))

    const newCellValue = await promise

    expect(newCellValue).toEqual(6)
  })

  it('batch works with async functions', async() => {
    const [engine] = HyperFormula.buildFromArray([[]])

    const [,promise] = engine.batch(() => {
      engine.setCellContents(adr('A1'), 1)
      engine.setCellContents(adr('B1'), '=ASYNC_FOO()')

      try {
        engine.getSheetValues(0)
      } catch(error) {
        expect(error).toEqualError(new EvaluationSuspendedError())
      }
    })

    expect(engine.getSheetValues(0)).toEqual([[1, getLoadingError('Sheet1!B1')]])

    const asyncChanges = await promise

    expect(engine.getSheetValues(0)).toEqual([[1, 1]])
    expect(asyncChanges).toEqual([new ExportedCellChange(adr('B1'), 1)])
  })

  describe('undo', () => {
    it('undo works with async functions before promises resolve', () => {
      const sheet = [[
        1, '=ASYNC_FOO()'
      ]]
      const [engine] = HyperFormula.buildFromArray(sheet)
  
      engine.setSheetContent(0, [[
        '=ASYNC_FOO()', 1
      ]])
  
      engine.undo()

      const [expectedEngine] = HyperFormula.buildFromArray(sheet)

      expectEngineToBeTheSameAs(engine, expectedEngine)
    })

    it('undo works with async functions after promises resolve', async() => {
      const sheet = [[
        2, '=ASYNC_FOO()'
      ]]
      const [engine] = HyperFormula.buildFromArray(sheet)
  
      const [,promise] = engine.setSheetContent(0, [[
        '=ASYNC_FOO()', 2
      ]])

      await promise
  
      engine.undo()

      const [expectedEngine, enginePromise] = HyperFormula.buildFromArray(sheet)

      await enginePromise

      expectEngineToBeTheSameAs(engine, expectedEngine)
    })
  })

  describe('redo', () => {
    it('redo works with async functions before promises resolve', () => {
      const [engine] = HyperFormula.buildFromArray([[
        1, '=ASYNC_FOO()'
      ]])
  
      const sheet = [[
        '=ASYNC_FOO()', 1
      ]]

      engine.setSheetContent(0, sheet)
  
      engine.undo()
      engine.redo()

      const [expectedEngine] = HyperFormula.buildFromArray(sheet)

      expectEngineToBeTheSameAs(engine, expectedEngine)
    })

    it('redo works with async functions after promises resolve', async() => {
      const [engine] = HyperFormula.buildFromArray([[
        '=ASYNC_FOO()', 2
      ]])
  
      const sheet = [[
        2, '=ASYNC_FOO()'
      ]]

      await engine.setSheetContent(0, sheet)[1]

      await engine.undo()[1]
      await engine.redo()[1]

      const [expectedEngine, enginePromise] = HyperFormula.buildFromArray(sheet)

      await enginePromise

      expectEngineToBeTheSameAs(engine, expectedEngine)
    })
  })
})
