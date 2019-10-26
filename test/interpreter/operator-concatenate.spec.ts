import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter - concatenate operator', () => {
  it('Ampersand with string arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['="foo"&"bar"'],
    ])

    expect(engine.getCellValue('A1')).toBe('foobar')
  })

  it('Ampersand with cell address', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo', '=A1&"bar"'],
    ])

    expect(engine.getCellValue('B1')).toBe('foobar')
  })

  it('Ampersand with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1&2'],
    ])

    expect(engine.getCellValue('A1')).toBe('12')
  })

  it('Ampersand with bool', () => {
    const engine = HyperFormula.buildFromArray([
      ['="foo"&TRUE()'],
    ])

    expect(engine.getCellValue('A1')).toBe('footrue')
  })

  it('Ampersand with error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1/0', '=A1&TRUE()'],
    ])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
