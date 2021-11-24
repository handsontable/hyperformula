import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {ErrorMessage} from '../src/error-message'
import {plPL} from '../src/i18n/languages'
import {adr, detailedError} from './testUtils'

describe('update config', () => {
  it('simple reload preserves all values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    await engine.updateConfig({})

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('C1'))).toBe(2)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })
  it('simple reload preserves formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    await engine.updateConfig({})

    expect(engine.getCellFormula(adr('B1'))).toBe('=A1')
    expect(engine.getCellFormula(adr('C1'))).toBe('=SUM(A1:B1)')
    expect(engine.getCellFormula(adr('B2'))).toBe('=B2')
    expect(engine.getCellFormula(adr('C2'))).toBe('=F(')
  })

  it('simple reload preserves values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1.00000000000001', '1', '=A1-B1'],
    ], {smartRounding: false})
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.00000000000001)

    await engine.updateConfig({smartRounding: true})

    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })
  it('language reload', async() => {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = await HyperFormula.buildFromArray([
      ['=FOO()', '=SUM()', '=SUMA()', 'SUM()', '=SUM('],
    ])
    await engine.updateConfig({language: 'plPL'})

    expect(engine.getCellFormula(adr('A1'))).toBe('=FOO()')
    expect(engine.getCellFormula(adr('B1'))).toBe('=SUMA()')
    expect(engine.getCellFormula(adr('C1'))).toBe('=SUMA()')
    expect(engine.getCellFormula(adr('D1'))).toBe(undefined)
    expect(engine.getCellFormula(adr('E1'))).toBe('=SUM(')
  })

  it('simple reload preserves namedexpressions', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=TRUE', '=FALSE'],
    ])
    await engine.addNamedExpression('TRUE', true)
    await engine.addNamedExpression('FALSE', false)
    await engine.updateConfig({})

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })
})
