import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {ErrorMessage} from '../src/error-message'
import {plPL} from '../src/i18n/languages'
import {adr, detailedError} from './testUtils'

describe('update config', () => {
  it('simple reload preserves all values', () => {
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromArray([
      ['1.00000000000001', '1', '=A1-B1'],
    ], {smartRounding: false})
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.00000000000001)

    engine.updateConfig({smartRounding: true})

    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })
  it('language reload', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const [engine] = HyperFormula.buildFromArray([
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
    const [engine] = HyperFormula.buildFromArray([
      ['=TRUE', '=FALSE'],
    ])
    engine.addNamedExpression('TRUE', true)
    engine.addNamedExpression('FALSE', false)
    engine.updateConfig({})

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })
})
