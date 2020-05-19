import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {ErrorType, InternalCellValue, SimpleCellAddress} from '../src/Cell'
import {HyperFormula, FunctionPluginValidationError} from '../src'
import {adr, detailedError, expectArrayWithSameContent, unregisterAllFormulas} from './testUtils'
import {SumifPlugin} from '../src/interpreter/plugin/SumifPlugin'
import {NumericAggregationPlugin} from '../src/interpreter/plugin/NumericAggregationPlugin'
import {enGB, plPL} from '../src/i18n'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    },
    'BAR': {
      method: 'bar'
    }
  }

  public static translations = {
    'enGB': {
      'FOO': 'FOO',
      'BAR': 'BAR'
    },
    'plPL': {
      'FOO': 'FU',
      'BAR': 'BAR'
    }
  }

  public foo(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return 'foo'
  }

  public bar(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return 'bar'
  }
}

class SumWithExtra extends FunctionPlugin {
  public static implementedFunctions = {
    'SUM': {
      method: 'sum',
    }
  }

  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    const left = this.evaluateAst(ast.args[0], formulaAddress) as number
    const right = this.evaluateAst(ast.args[1], formulaAddress) as number
    return 42 + left + right
  }
}

class InvalidPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    }
  }

  public bar(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return 'bar'
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

    const engine = HyperFormula.buildFromArray([['=FOO()']])

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })

  it('should return registered formula translations', () => {
    unregisterAllFormulas()
    HyperFormula.registerLanguage('plPL', plPL)
    HyperFormula.registerFunctionPlugin(SumifPlugin)
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)
    const formulaNames = HyperFormula.getRegisteredFunctionNames('plPL')

    expectArrayWithSameContent(['FU', 'BAR', 'SUMA.JEŻELI', 'LICZ.JEŻELI', 'ŚREDNIA.JEŻELI', 'SUMY.JEŻELI', 'LICZ.WARUNKI'], formulaNames)
  })

  it('should register all formulas from plugin', () => {
    HyperFormula.registerFunctionPlugin(FooPlugin, FooPlugin.translations)

    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('FOO')
    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should register single formula from plugin', () => {
    HyperFormula.registerFunction('BAR', FooPlugin, FooPlugin.translations)
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctionNames('enGB')).not.toContain('FOO')
    expect(HyperFormula.getRegisteredFunctionNames('enGB')).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should override one formula with custom implementation', () => {
    HyperFormula.registerFunction('SUM', SumWithExtra)
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=MAX(1, 2)']
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
    unregisterAllFormulas()
    HyperFormula.registerFunctionPlugin(SumifPlugin)
    HyperFormula.registerFunctionPlugin(NumericAggregationPlugin)
    HyperFormula.registerFunctionPlugin(SumWithExtra)

    expectArrayWithSameContent(HyperFormula.getAllFunctionPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })

  it('should unregister whole plugin', () => {
    unregisterAllFormulas()
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

    expect(HyperFormula.getRegisteredFunctionNames('enGB').length).toEqual(0)
  })
})

describe('Instance level formula registry', () => {
  beforeEach(() => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    HyperFormula.getLanguage('enGB').extendFunctions({BAR: 'BAR'})
  })

  it('should return registered formula ids', () => {
    const engine = HyperFormula.buildFromArray([], {functionPlugins: [FooPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getRegisteredFunctionNames(), ['SUM', 'FOO', 'BAR'])
  })

  it('should create engine only with plugins passed to configuration', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()', '=SUM(1, 2)']
    ], {functionPlugins: [FooPlugin]})

    expectArrayWithSameContent(['FOO', 'BAR'], engine.getRegisteredFunctionNames())
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('modifying static plugins should not affect existing engine instance registry', () => {
    HyperFormula.registerFunctionPlugin(FooPlugin)
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])
    HyperFormula.unregisterFunction('FOO')

    engine.setCellContents(adr('C1'), '=A1')

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual('foo')
  })

  it('should return registered plugins', () => {
    const engine = HyperFormula.buildFromArray([], {functionPlugins: [SumifPlugin, NumericAggregationPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getAllFunctionPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })

  it('should instantiate engine with additional plugin', () => {
    const engine = HyperFormula.buildFromArray([], {
      functionPlugins: [...HyperFormula.getAllFunctionPlugins(), FooPlugin]
    })

    const registeredPlugins = new Set(engine.getAllFunctionPlugins())

    expect(registeredPlugins.size).toEqual(HyperFormula.getAllFunctionPlugins().length + 1)
    expect(registeredPlugins.has(FooPlugin)).toBe(true)
  })

  it('should rebuild engine and override plugins', () => {
    const engine = HyperFormula.buildFromArray([])

    let registeredPlugins = new Set(engine.getAllFunctionPlugins())
    expect(registeredPlugins.has(SumifPlugin)).toBe(true)
    expect(registeredPlugins.has(FooPlugin)).toBe(false)

    engine.updateConfig({functionPlugins: [FooPlugin]})
    registeredPlugins = new Set(engine.getAllFunctionPlugins())
    expect(registeredPlugins.has(FooPlugin)).toBe(true)
    expect(registeredPlugins.size).toBe(1)
  })

  it('should return plugin for given functionId', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.getFunctionPlugin('SUMIF')).toBe(SumifPlugin)
  })
})