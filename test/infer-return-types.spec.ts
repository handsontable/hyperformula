import {CellValueDetailedType, HyperFormula, SimpleRangeValue} from '../src'
import {ArraySize} from '../src/ArraySize'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {InterpreterValue} from '../src/interpreter/InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr} from './testUtils'

class FooPlugin extends FunctionPlugin implements FunctionPluginTypecheck<FooPlugin> {
  public static implementedFunctions = {
    'ARRAYINFERFOO': {
      method: 'arrayinferfoo',
      arraySizeMethod: 'arraysizeFoo',
      inferReturnType: true,
      parameters: []
    },
    'INFERFOO': {
      method: 'inferfoo',
      inferReturnType: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY, optionalArg: true}
      ]
    },
  }

  public static translations = {
    'enGB': {
      'ARRAYINFERFOO': 'ARRAYINFERFOO',
      'INFERFOO': 'INFERFOO'
    },
  }

  public inferfoo(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INFERFOO'), (arg) => {
      if (arg === 0) {
        return '2%'
      }
      return '$2'  
    })
  }

  public arrayinferfoo(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYINFERFOO'), () => {
      return SimpleRangeValue.onlyValues([['$2', '2%'], [2, '"2%"']])
    })
  }

  public arraysizeFoo(_ast: ProcedureAst, _state: InterpreterState): ArraySize {
    return new ArraySize(2, 2)
  }
}

describe('infer return types', () => {
  beforeEach(() => {
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)
  })

  afterEach(() => {
    HyperFormula.unregisterFunctionPlugin(FooPlugin)
  })

  it('numbers', () => {
    const [engine] = HyperFormula.buildFromArray([['=INFERFOO()', '=INFERFOO(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    
    expect(engine.getCellValue(adr('B1'))).toEqual(.02)
    expect(engine.getCellValueDetailedType(adr('B1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('arrays', () => {
    const [engine] = HyperFormula.buildFromArray([['=ARRAYINFERFOO()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    
    expect(engine.getCellValue(adr('B1'))).toEqual(.02)
    expect(engine.getCellValueDetailedType(adr('B1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValueDetailedType(adr('A2'))).toBe(CellValueDetailedType.NUMBER_RAW)
    
    expect(engine.getCellValue(adr('B2'))).toEqual('\"2%\"')
    expect(engine.getCellValueDetailedType(adr('B2'))).toBe(CellValueDetailedType.STRING)

  })
})