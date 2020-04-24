import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {ErrorType, InternalCellValue, SimpleCellAddress} from '../src/Cell'
import {HyperFormula} from '../src'
import {adr, detailedError, expectArrayWithSameContent, unregisterAllFormulas} from './testUtils'
import {FormulaPluginValidationError} from '../src/errors'
import {SumifPlugin} from '../src/interpreter/plugin/SumifPlugin'

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
    HyperFormula.registerFormulaPlugins(SumifPlugin, FooPlugin)
    const formulaIds = HyperFormula.getFormulas()

    expectArrayWithSameContent(['FOO', 'BAR', 'SUMIF', 'COUNTIF', 'AVERAGEIF', 'SUMIFS', 'COUNTIFS'], formulaIds)
  })

  it('should register all formulas from plugin', () => {
    HyperFormula.registerFormulaPlugins(FooPlugin)

    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getFormulas()).toContain('FOO')
    expect(HyperFormula.getFormulas()).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should register single formula from plugin', () => {
    HyperFormula.registerFormula('BAR', FooPlugin)
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])

    expect(HyperFormula.getFormulas()).not.toContain('FOO')
    expect(HyperFormula.getFormulas()).toContain('BAR')
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
  })

  it('should override one formula with custom implementation', () => {
    HyperFormula.registerFormula('SUM', SumWithExtra)
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=MAX(1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(45)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('should throw plugin validation error', () => {
    expect(() => {
      HyperFormula.registerFormulaPlugins(InvalidPlugin)
    }).toThrow(FormulaPluginValidationError.formulaMethodNotFound('foo', 'InvalidPlugin'))

    expect(() => {
      HyperFormula.registerFormula('FOO', InvalidPlugin)
    }).toThrow(FormulaPluginValidationError.formulaMethodNotFound('foo', 'InvalidPlugin'))

    expect(() => {
      HyperFormula.registerFormula('BAR', InvalidPlugin)
    }).toThrow(FormulaPluginValidationError.formulaNotDeclaredInPlugin('BAR', 'InvalidPlugin'))
  })
})

describe('Instance level formula registry', () => {
  beforeEach(() => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    HyperFormula.getLanguage('enGB').extendFunctions({BAR: 'BAR'})
  })
  
  it('should return registered formula ids', () => {
    const engine = HyperFormula.buildFromArray([], {functionPlugins: [FooPlugin, SumWithExtra]})

    expectArrayWithSameContent(engine.getFormulas(), ['SUM', 'FOO', 'BAR'])
  })

  it('should create engine only with plugins passed to configuration', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()', '=SUM(1, 2)']
    ], {functionPlugins: [FooPlugin]})

    expectArrayWithSameContent(['FOO', 'BAR'], engine.getFormulas())
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NAME))
  })

  it('modifying static plugins should not affect existing engine instance registry', () => {
    HyperFormula.registerFormulaPlugins(FooPlugin)
    const engine = HyperFormula.buildFromArray([
      ['=foo()', '=bar()']
    ])
    HyperFormula.unregisterFormula('FOO')

    engine.setCellContents(adr('C1'), '=A1')

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('B1'))).toEqual('bar')
    expect(engine.getCellValue(adr('C1'))).toEqual('foo')
  })
})