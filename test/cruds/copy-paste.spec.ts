import {Config, EmptyValue, HyperFormula} from '../../src'
import '../testConfig'
import {adr, expect_array_with_same_content} from '../testUtils'

describe('Copy - paste integration', () => {
  it('copy should return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', '=A1'],
    ])

    const values = engine.copy(adr('A1'), 2, 2)

    expect_array_with_same_content([1, 2], values[0])
    expect_array_with_same_content(['foo', 1], values[1])
  })

  it('should copy empty cell vertex', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=A1']
    ])

    engine.copy(adr('A1'), 1, 1)
    const changes = engine.paste(adr('A2'))

    expect_array_with_same_content([{ sheet:0, col: 0, row: 1, value: EmptyValue}], changes)
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

  it('should copy values from numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], new Config({ matrixDetection: true, matrixDetectionThreshold: 1}))
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    engine.copy(adr('A1'), 2, 2)
    engine.paste(adr('A3'))

    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('B3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expect(engine.getCellValue(adr('B4'))).toEqual(4)
  })

  it('should be possible to copy numeric matrix onto it self', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], new Config({ matrixDetection: true, matrixDetectionThreshold: 1}))
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    engine.copy(adr('A1'), 2, 2)
    engine.paste(adr('B1'))

    expect(engine.matrixMapping.matrixMapping.size).toEqual(0)
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('C2'))).toEqual(4)
  })
})
