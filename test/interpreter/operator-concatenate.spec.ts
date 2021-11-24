import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - concatenate operator', () => {
  it('Ampersand with string arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="foo"&"bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('foobar')
  })

  it('Ampersand with cell address', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo', '=A1&"bar"'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe('foobar')
  })

  it('Ampersand with number', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=1&2'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('12')
  })

  it('Ampersand with bool', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="foo"&TRUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('fooTRUE')
  })

  it('Ampersand with null', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="foo"&B1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('Ampersand with error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=1/0', '=A1&TRUE()'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
