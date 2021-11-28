import {ExportedNamedExpressionChange, HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
import {Events} from '../src/Emitter'
import {ErrorMessage} from '../src/error-message'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {AsyncInternalScalarValue} from '../src/interpreter/InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class AsyncPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AsyncPlugin> {
  public static implementedFunctions = {
    'ASYNC_FOO': {
      method: 'asyncFoo',
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'TIMEOUT_FOO': {
      method: 'timeoutFoo',
    },
    'ASYNC_ERROR_FOO': {
      method: 'asyncErrorFoo',
    },
  }

  public static translations = {
    'enGB': {
      'ASYNC_FOO': 'ASYNC_FOO',
      'TIMEOUT_FOO': 'TIMEOUT_FOO',
      'ASYNC_ERROR_FOO': 'ASYNC_ERROR_FOO'
    },
    'plPL': {
      'ASYNC_FOO': 'ASYNC_FOO',
      'TIMEOUT_FOO': 'TIMEOUT_FOO',
      'ASYNC_ERROR_FOO': 'ASYNC_ERROR_FOO'
    }
  }

  public async asyncFoo(ast: ProcedureAst, state: InterpreterState): AsyncInternalScalarValue {
    return new Promise(resolve => setTimeout(() => {
      if (ast.args[0]) {
        const argument = this.evaluateAst(ast.args[0], state) as number

        resolve(argument + 5)

        return
      }
  
      resolve(1)
    }, 1000))
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

describe('async functions', () => {
  beforeEach(() => {
    HyperFormula.registerFunctionPlugin(AsyncPlugin, AsyncPlugin.translations)
  })

  afterEach(() => {
    HyperFormula.unregisterFunctionPlugin(AsyncPlugin)
  })

  describe('recompute partial formulas', () => {
    it('should return all sync values immediately', () => {
      const engine = HyperFormula.buildEmpty()

      engine.addSheet('Sheet1')

      engine.setSheetContent(0, [[1, '=ASYNC_FOO()', '=SUM(A1:B1)']])

      expect(engine.getSheetValues(0)).toEqual([[1, 'Loading...', 1]])
    })

    it('async values are calculated after promises resolve', (done) => {
      const engine = HyperFormula.buildEmpty()

      engine.addSheet('Sheet1')

      engine.setSheetContent(0, [[1, '=ASYNC_FOO()', '=SUM(A1:B1)', '=ASYNC_FOO(A1)']])

      const handler = () => {
        expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 6]])

        done()
      }

      engine.on(Events.AsyncValuesUpdated, handler)
    })
  })
   
  describe('recompute all formulas', () => {
    it('should return all sync values immediately', () => {
      const engine = HyperFormula.buildFromArray([
        [1, '=ASYNC_FOO()', '=SUM(A1:B1)'],
      ])

      expect(engine.getSheetValues(0)).toEqual([[1, 'Loading...', 1]])
    })

    it('async values are calculated after promises resolve', (done) => {
      const engine = HyperFormula.buildFromArray([
        [1, '=ASYNC_FOO()', '=SUM(A1:B1)', '=ASYNC_FOO(A1)'],
      ])

      const handler = () => {
        expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 6]])

        done()
      }

      engine.on(Events.AsyncValuesUpdated, handler)
    })

    it('should return #TIMEOUT error if function does not resolve due to the request taking too long', (done) => {
      const engine = HyperFormula.buildFromArray([
        ['=TIMEOUT_FOO()', 'foo'],
      ])

      const handler = () => {
        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.TIMEOUT, ErrorMessage.FunctionTimeout))
        expect(engine.getCellValue(adr('B1'))).toBe('foo')
    
        done()
      }

      engine.on(Events.AsyncValuesUpdated, handler)
    }, Config.defaultConfig.timeoutTime + 3000)

    it('should throw an error if function does not resolve', async() => {      
      const engine = HyperFormula.buildFromArray([
        ['=ASYNC_ERROR_FOO()'],
      ])

      try {
        await engine.evaluator.recomputedAsyncFunctionsPromise
      } catch (error) {
        expect(error).toEqualError(new Error('asyncErrorFoo'))
      }
    })
  })

  describe('named expressions', () => {
    it('using native boolean as expression', (done) => {
      const engine = HyperFormula.buildEmpty()
      const changes = engine.addNamedExpression('asyncFoo', '=ASYNC_FOO()')
  
      const handler = () => {
        expect(engine.getNamedExpressionValue('asyncFoo')).toEqual(1)

        done()
      }

      engine.on(Events.AsyncValuesUpdated, handler)

      expect(changes).toEqual([new ExportedNamedExpressionChange('asyncFoo', 'Loading...')])
      expect(engine.getNamedExpressionValue('asyncFoo')).toEqual('Loading...')
    })
  })
})
