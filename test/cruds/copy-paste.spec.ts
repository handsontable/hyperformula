import {HyperFormula} from '../../src'
import '../testConfig'
import {adr, expect_array_with_same_content} from '../testUtils'

describe('Copy - paste integration', () => {
  it('copy should return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', 'bar'],
    ])

    const values = engine.copy(adr('A1'), 2, 2)

    expect_array_with_same_content([1, 2], values[0])
    expect_array_with_same_content(['foo', 'bar'], values[1])
  })

  it('should work for single number', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.copy(adr('A1'), 1, 1)
    engine.paste(adr('B1'))

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('should work for area', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', 'bar'],
    ])

    engine.copy(adr('A1'), 2, 2)
    engine.paste(adr('C1'))

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('C2'))).toEqual('foo')
    expect(engine.getCellValue(adr('D2'))).toEqual('bar')
  })

  it('should work for simple cell reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(adr('B1'), 1, 1)
    engine.paste(adr('C1'))

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
  })

  it('paste should return newly pasted values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(adr('A1'), 2, 1)
    const changes = engine.paste(adr('A2'))

    expect_array_with_same_content([
      { sheet:0, col: 0, row: 1, value: 1},
      { sheet:0, col: 1, row: 1, value: 1},
    ], changes)
  })
})
