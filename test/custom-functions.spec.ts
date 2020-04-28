import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {ErrorType, InternalCellValue, SimpleCellAddress} from '../src/Cell'
import {HyperFormula} from '../src'
import {adr, detailedError, expectArrayWithSameContent, unregisterAllFormulas} from './testUtils'
import {FunctionPluginValidationError} from '../src/errors'
import {SumifPlugin} from '../src/interpreter/plugin/SumifPlugin'
import {NumericAggregationPlugin} from '../src/interpreter/plugin/NumericAggregationPlugin'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    },
    'BAR': {
      method: 'bar'
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
  beforeEach(() => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    HyperFormula.getLanguage('enGB').extendFunctions({BAR: 'BAR'})
  })

  it('should return registered formula ids', () => {
    unregisterAllFormulas()
    HyperFormula.registerFunctionPlugins(SumifPlugin, FooPlugin)
    const formulaIds = HyperFormula.getRegisteredFunctions()

    expectArrayWithSameContent(['FOO', 'BAR', 'SUMIF', 'COUNTIF', 'AVERAGEIF', 'SUMIFS', 'COUNTIFS'], formulaIds)
  })

  it('should register all formulas from plugin', () => {
    HyperFormula.registerFunctionPlugins(FooPlugin)

    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctions()).toContain('FOO')
    expect(HyperFormula.getRegisteredFunctions()).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should register single formula from plugin', () => {
    HyperFormula.registerFunction('BAR', FooPlugin)
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getRegisteredFunctions()).not.toContain('FOO')
    expect(HyperFormula.getRegisteredFunctions()).toContain('BAR')
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
      HyperFormula.registerFunctionPlugins(InvalidPlugin)
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
    HyperFormula.registerFunctionPlugins(SumifPlugin)
    HyperFormula.registerFunctionPlugins(NumericAggregationPlugin)
    HyperFormula.registerFunctionPlugins(SumWithExtra)

    expectArrayWithSameContent(HyperFormula.getPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })

  it('should unregister whole plugin', () => {
    unregisterAllFormulas()
    HyperFormula.registerFunctionPlugins(SumifPlugin, NumericAggregationPlugin)
    HyperFormula.unregisterFunctionPlugin(NumericAggregationPlugin)

    expectArrayWithSameContent(HyperFormula.getPlugins(), [SumifPlugin])
  })
})

describe('Instance level formula registry', () => {
  beforeEach(() => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    HyperFormula.getLanguage('enGB').extendFunctions({BAR: 'BAR'})
  })
  
  it('should return registered formula ids', () => {
    const engine = HyperFormula.buildFromArray([], {functionPlugins: [FooPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getRegisteredFunctions(), ['SUM', 'FOO', 'BAR'])
  })

  it('should create engine only with plugins passed to configuration', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()', '=SUM(1, 2)']
    ], {functionPlugins: [FooPlugin]})

    expectArrayWithSameContent(['FOO', 'BAR'], engine.getRegisteredFunctions())
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('modifying static plugins should not affect existing engine instance registry', () => {
    HyperFormula.registerFunctionPlugins(FooPlugin)
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
    const engine = HyperFormula.buildFromArray([], { functionPlugins: [SumifPlugin, NumericAggregationPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getPlugins(), [SumifPlugin, NumericAggregationPlugin, SumWithExtra])
  })
})