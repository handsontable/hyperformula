import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - concatenate operator', () => {
  it('Ampersand with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="foo"&"bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('foobar')
  })

  it('Ampersand with cell address', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo', '=A1&"bar"'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe('foobar')
  })

  it('Ampersand with number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=1&2'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('12')
  })

  it('Ampersand with bool', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="foo"&TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fooTRUE')
  })

  it('Ampersand with null', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="foo"&B1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('Ampersand with error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=1/0', '=A1&TRUE()'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
