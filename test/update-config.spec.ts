import {HyperFormula, ErrorType} from '../src'
import {ErrorMessage} from '../src/error-message'
import {plPL} from '../src/i18n/languages'
import {adr, detailedError, resetSpy} from './testUtils'
import {BuildEngineFactory} from '../src/BuildEngineFactory'

describe('update config', () => {
  it('simple reload preserves all values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    engine.updateConfig({})

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })
  it('simple reload preserves formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    engine.updateConfig({})

    expect(engine.getCellFormula(adr('B1'))).toBe('=A1')
    expect(engine.getCellFormula(adr('C1'))).toBe('=SUM(A1:B1)')
    expect(engine.getCellFormula(adr('B2'))).toBe('=B2')
    expect(engine.getCellFormula(adr('C2'))).toBe('=F(')
  })

  it('simple reload preserves values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.00000000000001', '1', '=A1-B1'],
    ], {smartRounding: false})
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.00000000000001)

    engine.updateConfig({smartRounding: true})

    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })
  it('language reload', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = HyperFormula.buildFromArray([
      ['=FOO()', '=SUM()', '=SUMA()', 'SUM()', '=SUM('],
    ])
    engine.updateConfig({language: 'plPL'})

    expect(engine.getCellFormula(adr('A1'))).toBe('=FOO()')
    expect(engine.getCellFormula(adr('B1'))).toBe('=SUMA()')
    expect(engine.getCellFormula(adr('C1'))).toBe('=SUMA()')
    expect(engine.getCellFormula(adr('D1'))).toBe(undefined)
    expect(engine.getCellFormula(adr('E1'))).toBe('=SUM(')
  })

  it('simple reload preserves namedexpressions', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUE', '=FALSE'],
    ])
    engine.addNamedExpression('TRUE', true)
    engine.addNamedExpression('FALSE', false)
    engine.updateConfig({})

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })

  it('doesn\'t rebuild the engine when new config is the same as the old one', () => {
    const config = { useArrayArithmetic: true }
    const engine = HyperFormula.buildFromArray([[]], config)

    const rebuildEngineSpy = spyOn(BuildEngineFactory, 'rebuildWithConfig')
    resetSpy(rebuildEngineSpy)

    engine.updateConfig(config)
    expect(rebuildEngineSpy).not.toHaveBeenCalled()
  })

  it('rebuilds the engine when new config adds new timeFormat to the same instance of timeFormats array', () => {
    const config = { timeFormats: ['hh:mm:ss.sss'] }
    const engine = HyperFormula.buildFromArray([[]], config)

    const rebuildEngineSpy = spyOn(BuildEngineFactory, 'rebuildWithConfig')
    resetSpy(rebuildEngineSpy)

    config.timeFormats.push('hh:mm:ss')
    engine.updateConfig(config)
    expect(rebuildEngineSpy).toHaveBeenCalled()
  })

  it('rebuilds the engine when new config adds new currencySymbol to the same instance of currencySymbol array', () => {
    const config = { currencySymbol: ['$'] }
    const engine = HyperFormula.buildFromArray([[]], config)

    const rebuildEngineSpy = spyOn(BuildEngineFactory, 'rebuildWithConfig')
    resetSpy(rebuildEngineSpy)

    config.currencySymbol.push('€')
    engine.updateConfig(config)
    expect(rebuildEngineSpy).toHaveBeenCalled()
  })

  it('doesn\'t rebuild the engine when new config contains only the default config values', () => {
    const engine = HyperFormula.buildFromArray([[]], {})

    const rebuildEngineSpy = spyOn(BuildEngineFactory, 'rebuildWithConfig')
    resetSpy(rebuildEngineSpy)

    engine.updateConfig({ useColumnIndex: false, functionArgSeparator: ',', undoLimit: 20 })
    expect(rebuildEngineSpy).not.toHaveBeenCalled()
  })
})
