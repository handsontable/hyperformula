import {CellError, Config, EmptyValue, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {CellAddress} from '../../src/parser'
import {CellReferenceType} from '../../src/parser/CellAddress'
import '../testConfig'
import {adr, detailedError, expectArrayWithSameContent, extractReference} from '../testUtils'

describe('Copy - paste integration', () => {
  it('copy should return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', '=A1'],
    ])

    const values = engine.copy(adr('A1'), 2, 2)

    expectArrayWithSameContent([1, 2], values[0])
    expectArrayWithSameContent(['foo', 1], values[1])
  })

  it('copy should round return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.0000000001', '1.000000000000001'],
    ])

    const values = engine.copy(adr('A1'), 2, 1)

    expectArrayWithSameContent([1.0000000001, 1], values[0])
  })

  it('should copy empty cell vertex', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=A1']
    ])

    engine.copy(adr('A1'), 1, 1)
    const changes = engine.paste(adr('A2'))

    expectArrayWithSameContent([{ sheet:0, col: 0, row: 1, value: EmptyValue}], changes)
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

  it('should not round here', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.0000000001', '1.000000000000001'],
    ])

    engine.copy(adr('A1'), 2, 1)
    engine.paste(adr('A2'))

    expect(engine.dependencyGraph.getCellValue(adr('A2'))).toEqual(1.0000000001)
    expect(engine.dependencyGraph.getCellValue(adr('B2'))).toEqual(1.000000000000001)
  })

  it('should work for cell reference inside copied area', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(adr('A1'), 2, 1)
    engine.paste(adr('A2'))

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    const a2 = engine.dependencyGraph.fetchCell(adr('A2'))
    const b2 = engine.dependencyGraph.fetchCell(adr('B2'))

    expect(engine.dependencyGraph.existsEdge(a2, b2)).toBe(true)
    expect(engine.dependencyGraph.existsEdge(a1, b2)).toBe(false)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('should work for absolute cell reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=$A$1'],
    ])

    engine.copy(adr('B1'), 1, 1)
    engine.paste(adr('B2'))

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    const b1 = engine.dependencyGraph.fetchCell(adr('B1'))
    const b2 = engine.dependencyGraph.fetchCell(adr('B2'))

    expect(engine.dependencyGraph.existsEdge(a1, b1)).toBe(true)
    expect(engine.dependencyGraph.existsEdge(a1, b2)).toBe(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('should work for cell reference pointing outside copied area', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
      ['2', ''],
    ])

    engine.copy(adr('B1'), 1, 1)
    engine.paste(adr('B2'))

    expect(engine.getCellValue(adr('B2'))).toEqual(2)
  })

  it('should return ref when pasted reference is out of scope', () => {
    const engine = HyperFormula.buildFromArray([
      [null, null],
      [null, '=B1'],
    ])

    engine.copy(adr('B2'), 1, 1)
    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.REF))
  })

  it('should create new range vertix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '3'],
      ['2', '4'],
      ['=SUM(A1:A2)']
    ])
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(1)

    engine.copy(adr('A3'), 1, 1)
    engine.paste(adr('B3'))

    expect(engine.getCellValue(adr('B3'))).toEqual(7)
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(engine.dependencyGraph.getRange(adr('B1'), adr('B2'))).not.toBeNull()
  })


  it('paste should return newly pasted values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(adr('A1'), 2, 1)
    const changes = engine.paste(adr('A2'))

    expectArrayWithSameContent([
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

  it('should be possible to paste string onto numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo'],
      ['3', '4'],
    ], new Config({ matrixDetection: true, matrixDetectionThreshold: 1}))
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    engine.copy(adr('A1'), 1, 1)
    engine.paste(adr('A2'))

    expect(engine.matrixMapping.matrixMapping.size).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual('foo')
    expect(engine.getCellValue(adr('B2'))).toEqual(4)
  })

  it('should be possible to copy numeric matrix onto itself', () => {
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

  it('should copy values from formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}']
    ])
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    engine.copy(adr('A3'), 2, 2)
    engine.paste(adr('A5'))

    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)
    expect(engine.getCellFormula(adr('A5'))).toBe(undefined)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('B5'))).toEqual(3)
    expect(engine.getCellValue(adr('A6'))).toEqual(2)
    expect(engine.getCellValue(adr('B6'))).toEqual(4)
  })

  it('should not be possible to paste onto formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}']
    ])

    engine.copy(adr('A1'), 2, 2)

    expect(() => {
      engine.paste(adr('A3'))
    }).toThrowError('It is not possible to paste onto matrix')
  })

  it('should do nothing when empty clipboard', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should not be possible to paste to not existing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet1!A2', '=Sheet2!A2']],
    })

    engine.copy(adr('A1'), 2, 1)

    expect(() => {
      engine.paste(adr('A1', 1))
    }).toThrowError('Invalid arguments')
  })

  it('should copy references with absolute sheet id', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet1!A2', '=Sheet2!A2']],
      'Sheet2': []
    })

    engine.copy(adr('A1'), 2, 1)
    engine.paste(adr('A1', 1))

    expect(extractReference(engine, adr('A1', 1))).toEqual(new CellAddress(0, 0, 1, CellReferenceType.CELL_REFERENCE_RELATIVE))
    expect(extractReference(engine, adr('B1', 1))).toEqual(new CellAddress(1, -1, 1, CellReferenceType.CELL_REFERENCE_RELATIVE))
  })

  /* Inconsistency with Product 1
   * We should think about distinction of relative and absolute sheet addresses */
  it('sheet id should not be adjusted when copying "relative" sheet reference to other sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=A2']],
      'Sheet2': []
    })

    engine.copy(adr('A1'), 1, 1)
    engine.paste(adr('A1', 1))

    expect(extractReference(engine, adr('A1', 1))).toEqual(new CellAddress(0, 0, 1, CellReferenceType.CELL_REFERENCE_RELATIVE))
  })

  it('should do nothing when clipboard is cleard after copy', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(adr('A1'), 2, 1)
    engine.clearClipboard()
    engine.paste(adr('A2'))

    expect(engine.getCellValue(adr('A2'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B2'))).toEqual(EmptyValue)
  })
})
