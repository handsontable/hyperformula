import {ExportedNamedExpressionChange, HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
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
beforeEach(() => {
  HyperFormula.registerFunctionPlugin(AsyncPlugin, AsyncPlugin.translations)
})

afterEach(() => {
  HyperFormula.unregisterFunctionPlugin(AsyncPlugin)
})

describe('recompute partial formulas', () => {
  it('async values are calculated after promises resolve', async() => {
    const [engine] = HyperFormula.buildFromArray([])

    const [, promise] = engine.setSheetContent(0, [[1, '=ASYNC_FOO()', '=SUM(A1:B1)', '=ASYNC_FOO(A1)']])

    expect(engine.getSheetValues(0)).toEqual([[1, 'Loading...', 1, 'Loading...']])

    await promise

    expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 6]])
  })
})
  
describe('recompute all formulas', () => {
  it('async values are calculated after promises resolve', async() => {
    const [engine, promise] = HyperFormula.buildFromArray([
      [1, '=ASYNC_FOO()', '=SUM(A1:B1)', '=ASYNC_FOO(A1)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[1, 'Loading...', 1, 'Loading...']])

    await promise

    expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 6]])
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

it('named expressions', async() => {
  const [engine] = HyperFormula.buildEmpty()
  const [changes, promise] = engine.addNamedExpression('asyncFoo', '=ASYNC_FOO()')

  expect(changes).toEqual([new ExportedNamedExpressionChange('asyncFoo', 'Loading...')])
  expect(engine.getNamedExpressionValue('asyncFoo')).toEqual('Loading...')

  await promise

  expect(engine.getNamedExpressionValue('asyncFoo')).toEqual(1)
})

// it('calculateFormula', () => {
//   const [engine] = HyperFormula.buildFromArray([[
//     2
//   ]])
  
//   engine.calculateFormula('=ASYNC_FOO(A1)', 0)
// })
