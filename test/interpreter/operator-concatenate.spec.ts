import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter - concatenate operator', () => {
  it('Ampersand with string arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="foo"&"bar"'],
    ])

    expect(engine.getCellValue('A1')).toBe('foobar')
  })

  it('Ampersand with cell address', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['foo', '=A1&"bar"'],
    ])

    expect(engine.getCellValue('B1')).toBe('foobar')
  })

  it('Ampersand with number', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1&2'],
    ])

    expect(engine.getCellValue('A1')).toBe('12')
  })

  it('Ampersand with bool', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="foo"&TRUE()'],
    ])

    expect(engine.getCellValue('A1')).toBe('footrue')
  })

  it('Ampersand with error', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1/0', '=A1&TRUE()'],
    ])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })
})
