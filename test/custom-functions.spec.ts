import {FunctionPluginValidationError, HyperFormula, SimpleRangeValue} from '../src'
import {ArraySize} from '../src/ArraySize'
import {ErrorType} from '../src/Cell'
import {ErrorMessage} from '../src/error-message'
import {AliasAlreadyExisting, ProtectedFunctionError, ProtectedFunctionTranslationError} from '../src/errors'
import {plPL} from '../src/i18n/languages'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {InternalScalarValue} from '../src/interpreter/InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {NumericAggregationPlugin} from '../src/interpreter/plugin/NumericAggregationPlugin'
import {SumifPlugin} from '../src/interpreter/plugin/SumifPlugin'
import {VersionPlugin} from '../src/interpreter/plugin/VersionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError, expectArrayWithSameContent} from './testUtils'

class FooPlugin extends FunctionPlugin implements FunctionPluginTypecheck<FooPlugin> {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    },
    'BAR': {
      method: 'bar',
    },
    'ARRAYFOO': {
      method: 'arrayfoo',
      arraySizeMethod: 'arraysizeFoo',
    },
  }

  public static translations = {
    'enGB': {
      'FOO': 'FOO',
      'BAR': 'BAR',
      'ARRAYFOO': 'ARRAYFOO',
    },
    'plPL': {
      'FOO': 'FU',
      'BAR': 'BAR',
      'ARRAYFOO': 'ARRAYFOO',
    }
  }

  public foo(_ast: ProcedureAst, _state: InterpreterState): InternalScalarValue {
    return 'foo'
  }

  public bar(_ast: ProcedureAst, _state: InterpreterState): InternalScalarValue {
    return 'bar'
  }

  public arrayfoo(_ast: ProcedureAst, _state: InterpreterState): SimpleRangeValue {
    return SimpleRangeValue.onlyValues([[1, 1], [1, 1]])
  }

  public arraysizeFoo(_ast: ProcedureAst, _state: InterpreterState): ArraySize {
    return new ArraySize(2, 2)
  }
}

class SumWithExtra extends FunctionPlugin implements FunctionPluginTypecheck<SumWithExtra> {
  public static implementedFunctions = {
    'SUM': {
      method: 'sum',
    }
  }

  public static aliases = {
    'SUMALIAS': 'SUM',
  }

  public sum(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const left = this.evaluateAst(ast.args[0], state) as number
    const right = this.evaluateAst(ast.args[1], state) as number
    return 42 + left + right
  }
}

class InvalidPlugin extends FunctionPlugin implements FunctionPluginTypecheck<InvalidPlugin> {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    }
  }

  public bar(_ast: ProcedureAst, _state: InterpreterState): InternalScalarValue {
    return 'bar'
  }
}

class EmptyAliasPlugin extends FunctionPlugin implements FunctionPluginTypecheck<EmptyAliasPlugin> {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    }
  }

  public static aliases = {
    'FOOALIAS': 'BAR',
  }
}

class OverloadedAliasPlugin extends FunctionPlugin implements FunctionPluginTypecheck<OverloadedAliasPlugin> {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    },
    'BAR': {
      method: 'foo',
    }
  }

  public static aliases = {
    'FOO': 'BAR',
  }
}

class ReservedNamePlugin extends FunctionPlugin implements FunctionPluginTypecheck<ReservedNamePlugin> {
  public static implementedFunctions = {
    'VERSION': {
      method: 'version',
    }
  }

  public version(_ast: ProcedureAst, _state: InterpreterState): InternalScalarValue {
    return 'foo'
  }
}

describe('Register static custom plugin', () => {
  it('should register plugin with translations', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)

    const pl = HyperFormula.getLanguage('plPL')

    expect(pl.getFunctionTranslation('FOO')).toEqual('FU')
  })

  it('should register single function with translations', () => {
    HyperFormula.registerFunction('FOO', FooPlugin, FooPlugin.translations)

    const [engine] = HyperFormula.buildFromArray([['=FOO()']])

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })

  it('should return registered formula translations', () => {
    HyperFormula.unregisterAllFunctions()
    HyperFormula.registerLanguage('plPL', plPL)
    HyperFormula.registerFunctionPlugin(SumifPlugin)
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)
    const formulaNames = HyperFormula.getRegisteredFunctionNames('plPL')

    expectArrayWithSameContent(['FU', 'BAR', 'ARRAYFOO', 'SUMA.JEŻELI', 'LICZ.JEŻELI', 'ŚREDNIA.JEŻELI', 'SUMY.JEŻELI', 'LICZ.WARUNKI', 'VERSION', 'PRZESUNIĘCIE'], formulaNames)
  })

  it('should register all formulas from plugin', () => {
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)

    const [engine] = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('FOO')
    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should register single formula from plugin', () => {
    HyperFormula.registerFunction('BAR', FooPlugin, FooPlugin.translations)
    const [engine] = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctionNames('enGB')).not.toContain('FOO')
    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOO')))
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should register single array functions', () => {
    HyperFormula.registerFunction('ARRAYFOO', FooPlugin, FooPlugin.translations)
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAYFOO()']
    ])

    expect(engine.getSheetValues(0)).toEqual([[1, 1], [1, 1]])
  })

  it('should override one formula with custom implementation', () => {
    HyperFormula.registerFunction('SUM', SumWithExtra)
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=MAX(1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(45)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('should allow to register only alias', () => {
    HyperFormula.registerFunction('SUMALIAS', SumWithExtra, {'enGB': {'SUMALIAS': 'SUMALIAS'}})
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMALIAS(1, 2)', '=MAX(1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(45)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('should throw plugin validation error', () => {
    expect(() => {
      HyperFormula.registerFunctionPlugin(InvalidPlugin)
    }).toThrow(FunctionPluginValidationError.functionMethodNotFound('foo', 'InvalidPlugin'))

    expect(() => {
      HyperFormula.registerFunction('FOO', InvalidPlugin)
    }).toThrow(FunctionPluginValidationError.functionMethodNotFound('foo', 'InvalidPlugin'))

    expect(() => {
      HyperFormula.registerFunction('BAR', InvalidPlugin)
    }).toThrow(FunctionPluginValidationError.functionNotDeclaredInPlugin('BAR', 'InvalidPlugin'))
  })

  it('should return registered plugins', () => {
    HyperFormula.unregisterAllFunctions()
    HyperFormula.registerFunctionPlugin(SumifPlugin)
    HyperFormula.registerFunctionPlugin(NumericAggregationPlugin)
    HyperFormula.registerFunctionPlugin(SumWithExtra)

    expectArrayWithSameContent(HyperFormula.getAllFunctionPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })

  it('should unregister whole plugin', () => {
    HyperFormula.unregisterAllFunctions()
    HyperFormula.registerFunctionPlugin(NumericAggregationPlugin)
    HyperFormula.registerFunctionPlugin(SumifPlugin)

    HyperFormula.unregisterFunctionPlugin(NumericAggregationPlugin)

    expectArrayWithSameContent(HyperFormula.getAllFunctionPlugins(), [SumifPlugin])
  })

  it('should return plugin for given functionId', () => {
    expect(HyperFormula.getFunctionPlugin('SUMIF')).toBe(SumifPlugin)
  })

  it('should clear function registry', () => {
    expect(HyperFormula.getRegisteredFunctionNames('enGB').length).toBeGreaterThan(0)

    HyperFormula.unregisterAllFunctions()

    expect(HyperFormula.getRegisteredFunctionNames('enGB').length).toEqual(2) // protected functions counts
  })
})

describe('Instance level formula registry', () => {
  beforeEach(() => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    HyperFormula.getLanguage('enGB').extendFunctions({BAR: 'BAR'})
  })

  it('should return registered formula ids', () => {
    const [engine] = HyperFormula.buildFromArray([], {functionPlugins: [FooPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getRegisteredFunctionNames(), ['SUM', 'FOO', 'BAR', 'VERSION'])
  })

  it('should create engine only with plugins passed to configuration', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=foo()', '=bar()', '=SUM(1, 2)']
    ], {functionPlugins: [FooPlugin]})

    expectArrayWithSameContent(['FOO', 'BAR', 'VERSION'], engine.getRegisteredFunctionNames())
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('SUM')))
  })

  it('modifying static plugins should not affect existing engine instance registry', () => {
    HyperFormula.registerFunctionPlugin(FooPlugin)
    const [engine] = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])
    HyperFormula.unregisterFunction('FOO')

    engine.setCellContents(adr('C1'), '=A1')

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual('foo')
  })

  it('should return registered plugins', () => {
    const [engine] = HyperFormula.buildFromArray([], {functionPlugins: [SumifPlugin, NumericAggregationPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getAllFunctionPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })

  it('should instantiate engine with additional plugin', () => {
    const [engine] = HyperFormula.buildFromArray([], {
      functionPlugins: [...HyperFormula.getAllFunctionPlugins(), FooPlugin]
    })

    const registeredPlugins = new Set(engine.getAllFunctionPlugins())

    expect(registeredPlugins.size).toEqual(HyperFormula.getAllFunctionPlugins().length + 1)
    expect(registeredPlugins.has(FooPlugin)).toBe(true)
  })

  it('should rebuild engine and override plugins', () => {
    const [engine] = HyperFormula.buildFromArray([])

    let registeredPlugins = new Set(engine.getAllFunctionPlugins())
    expect(registeredPlugins.has(SumifPlugin)).toBe(true)
    expect(registeredPlugins.has(FooPlugin)).toBe(false)

    engine.updateConfig({functionPlugins: [FooPlugin]})
    registeredPlugins = new Set(engine.getAllFunctionPlugins())
    expect(registeredPlugins.has(FooPlugin)).toBe(true)
    expect(registeredPlugins.size).toBe(1)
  })

  it('should return plugin for given functionId', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(engine.getFunctionPlugin('SUMIF')).toBe(SumifPlugin)
  })
})

describe('Reserved functions', () => {
  it('should not be possible to remove reserved function', () => {
    expect(() => {
      HyperFormula.unregisterFunction('VERSION')
    }).toThrow(ProtectedFunctionError.cannotUnregisterFunctionWithId('VERSION'))
  })

  it('should not be possible to unregister reserved plugin', () => {
    expect(() => {
      HyperFormula.unregisterFunctionPlugin(VersionPlugin)
    }).toThrow(ProtectedFunctionError.cannotUnregisterProtectedPlugin())
  })

  it('should not be possible to override reserved function', () => {
    expect(() => {
      HyperFormula.registerFunction('VERSION', ReservedNamePlugin)
    }).toThrow(ProtectedFunctionError.cannotRegisterFunctionWithId('VERSION'))

    expect(() => {
      HyperFormula.registerFunctionPlugin(ReservedNamePlugin)
    }).toThrow(ProtectedFunctionError.cannotRegisterFunctionWithId('VERSION'))
  })

  it('should return undefined when trying to retrieve protected function plugin', () => {
    expect(HyperFormula.getFunctionPlugin('VERSION')).toBe(undefined)
  })

  it('should not be possible to override protected function translation when registering plugin', () => {
    expect(() => {
      HyperFormula.registerFunction('FOO', FooPlugin, {'enGB': {'VERSION': 'FOOBAR'}})
    }).toThrow(new ProtectedFunctionTranslationError('VERSION'))

    expect(() => {
      HyperFormula.registerFunctionPlugin(FooPlugin, {'enGB': {'VERSION': 'FOOBAR'}})
    }).toThrow(new ProtectedFunctionTranslationError('VERSION'))
  })
})

describe('aliases', () => {
  it('should validate that alias target exists', () => {
    expect(() => {
      HyperFormula.registerFunctionPlugin(EmptyAliasPlugin)
    }).toThrow(FunctionPluginValidationError.functionMethodNotFound('foo', 'EmptyAliasPlugin'))
  })

  it('should validate that alias key is available', () => {
    expect(() => {
      HyperFormula.registerFunctionPlugin(OverloadedAliasPlugin)
    }).toThrow(new AliasAlreadyExisting('FOO', 'OverloadedAliasPlugin'))
  })
})
