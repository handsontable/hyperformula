import {ExportedCellChange, HyperFormula, NothingToPasteError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ErrorType, simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetSizeLimitExceededError} from '../../src/errors'
import {CellAddress} from '../../src/parser'
import {
  adr,
  colEnd,
  colStart,
  detailedError,
  expectArrayWithSameContent,
  extractReference,
  rowEnd,
  rowStart,
} from '../testUtils'

describe('Copy - paste integration', () => {
  it('copy should validate arguments', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 0, 42))
    }).toThrowError('Invalid arguments, expected width to be positive integer.')

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), -1, 42))
    }).toThrowError('Invalid arguments, expected width to be positive integer.')

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 3.14, 42))
    }).toThrowError('Invalid arguments, expected width to be positive integer.')

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 42, 0))
    }).toThrowError('Invalid arguments, expected height to be positive integer.')

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 42, -1))
    }).toThrowError('Invalid arguments, expected height to be positive integer.')

    expect(() => {
      engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 42, 3.14))
    }).toThrowError('Invalid arguments, expected height to be positive integer.')
  })

  it('paste raise error when there is nothing in clipboard', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(() => {
      engine.paste(adr('A2'))
    }).toThrow(new NothingToPasteError())
  })

  it('copy should return values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', '=A1'],
    ])

    const values = engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))

    expectArrayWithSameContent([1, 2], values[0])
    expectArrayWithSameContent(['foo', 1], values[1])
  })

  it('copy should round return values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1.0000000001', '1.000000000000001'],
    ])

    const values = engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))

    expectArrayWithSameContent([1.0000000001, 1], values[0])
  })

  it('should copy empty cell vertex', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=A1']
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    const [changes] = engine.paste(adr('A2'))

    expectArrayWithSameContent([new ExportedCellChange(adr('A2'), null)], changes)
  })

  it('should work for single number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('B1'))

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('should work for parsing error', () => {
    const sheet = [
      ['=SUM('],
    ]
    const [engine] = HyperFormula.buildFromArray(sheet)

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('B1'))

    expect(engine.getCellFormula(adr('B1'))).toEqual('=SUM(')
  })

  it('should work for area', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', 'bar'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
    engine.paste(adr('C1'))

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('C2'))).toEqual('foo')
    expect(engine.getCellValue(adr('D2'))).toEqual('bar')
  })

  it('should not round here', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1.0000000001', '1.000000000000001'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))
    engine.paste(adr('A2'))

    expect(engine.dependencyGraph.getCellValue(adr('A2'))).toEqual(1.0000000001)
    expect(engine.dependencyGraph.getCellValue(adr('B2'))).toEqual(1.000000000000001)
  })

  it('should work for cell reference inside copied area', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))
    engine.paste(adr('A2'))

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    const a2 = engine.dependencyGraph.fetchCell(adr('A2'))
    const b2 = engine.dependencyGraph.fetchCell(adr('B2'))

    expect(engine.dependencyGraph.existsEdge(a2, b2)).toBe(true)
    expect(engine.dependencyGraph.existsEdge(a1, b2)).toBe(false)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('should work for absolute cell reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=$A$1'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B2'))

    const a1 = engine.dependencyGraph.fetchCell(adr('A1'))
    const b1 = engine.dependencyGraph.fetchCell(adr('B1'))
    const b2 = engine.dependencyGraph.fetchCell(adr('B2'))

    expect(engine.dependencyGraph.existsEdge(a1, b1)).toBe(true)
    expect(engine.dependencyGraph.existsEdge(a1, b2)).toBe(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('should work for cell reference pointing outside copied area', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
      ['2', ''],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('B2'))

    expect(engine.getCellValue(adr('B2'))).toEqual(2)
  })

  it('should return ref when pasted reference is out of scope', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null],
      [null, '=A1'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B2'), 1, 1))
    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellSerialized(adr('A1'))).toEqual('=#REF!')
  })

  it('should return ref when pasted range is out of scope', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null],
      [null, '=A1:B2'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B2'), 1, 1))
    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellSerialized(adr('A1'))).toEqual('=#REF!')
  })

  it('should return ref when pasted range is out of scope 2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null, null],
      [null, null, null],
      [null, null, '=SUM(A1:B2)'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('C3'), 1, 1))
    engine.paste(adr('B2'))

    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellSerialized(adr('B2'))).toEqual('=SUM(#REF!)')
  })

  it('should return ref when pasted column range is out of scope', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null],
      [null, '=A:B'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B2'), 1, 1))
    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellSerialized(adr('A1'))).toEqual('=#REF!')
  })

  it('should return ref when pasted row range is out of scope', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, null],
      [null, '=1:2'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B2'), 1, 1))
    engine.paste(adr('A1'))

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellSerialized(adr('A1'))).toEqual('=#REF!')
  })

  it('should create new range vertex - cell range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '3'],
      ['2', '4'],
      ['=SUM(A1:A2)']
    ])
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(1)

    engine.copy(AbsoluteCellRange.spanFrom(adr('A3'), 1, 1))
    engine.paste(adr('B3'))

    expect(engine.getCellValue(adr('B3'))).toEqual(7)
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(engine.dependencyGraph.getRange(adr('B1'), adr('B2'))).not.toBeUndefined()
  })

  it('should create new range vertex - column range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '3', '5', '=SUM(A:B)'],
      ['2', '4', '6', null],
    ])
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(1)

    engine.copy(AbsoluteCellRange.spanFrom(adr('D1'), 1, 1))
    engine.paste(adr('E1'))

    expect(engine.getCellValue(adr('E1'))).toEqual(18)
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(engine.dependencyGraph.getRange(colStart('B'), colEnd('C'))).not.toBeUndefined()
  })

  it('should create new range vertex - row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(1:2)']
    ])
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(1)

    engine.copy(AbsoluteCellRange.spanFrom(adr('A4'), 1, 1))
    engine.paste(adr('A5'))

    expect(engine.getCellValue(adr('A5'))).toEqual(18)
    expect(Array.from(engine.dependencyGraph.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(engine.dependencyGraph.getRange(rowStart(2), rowEnd(3))).not.toBeUndefined()
  })

  it('should update edges between infinite range and pasted values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(2:3)', '1', '=SUM(1,2)']
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('B1'), 1, 1))
    engine.paste(adr('A2'))
    engine.copy(AbsoluteCellRange.spanFrom(adr('C1'), 1, 1))
    engine.paste(adr('A3'))

    const range = engine.rangeMapping.fetchRange(rowStart(2), rowEnd(3))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a3 = engine.addressMapping.fetchCell(adr('A3'))
    expect(engine.graph.existsEdge(a2, range))
    expect(engine.graph.existsEdge(a3, range))
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('paste should return newly pasted values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))
    const [changes] = engine.paste(adr('A2'))

    expectArrayWithSameContent([
      new ExportedCellChange(adr('A2'), 1),
      new ExportedCellChange(adr('B2'), 1),
    ], changes)
  })

  it('should copy values from formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])
    expect(engine.arrayMapping.arrayMapping.size).toEqual(1)

    engine.copy(AbsoluteCellRange.spanFrom(adr('A3'), 2, 2))
    engine.paste(adr('A5'))

    expect(engine.arrayMapping.arrayMapping.size).toEqual(1)
    expect(engine.getCellFormula(adr('A5'))).toBe(undefined)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('B5'))).toEqual(3)
    expect(engine.getCellValue(adr('A6'))).toEqual(2)
    expect(engine.getCellValue(adr('B6'))).toEqual(4)
  })

  it('should not be possible to paste onto formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))

    expect(() => {
      engine.paste(adr('A3'))
    }).toThrowError('It is not possible to paste onto an array')
  })

  it('should not be possible to paste to not existing sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet1!A2', '=Sheet2!A2']],
    })

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))

    expect(() => {
      engine.paste(adr('A1', 1))
    }).toThrowError('Invalid arguments, expected a valid target address.')
  })

  it('should copy references with absolute sheet id', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet1!A2', '=Sheet2!A2']],
      'Sheet2': []
    })

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))
    engine.paste(adr('A1', 1))

    expect(extractReference(engine, adr('A1', 1))).toEqual(CellAddress.relative(1, 0, 0))
    expect(extractReference(engine, adr('B1', 1))).toEqual(CellAddress.relative(1, -1, 1))
  })

  it('sheet reference should stay "relative" to other sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=A2']],
      'Sheet2': []
    })

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A1', 1))

    expect(extractReference(engine, adr('A1', 1))).toEqual(CellAddress.relative(1, 0))
  })

  it('should throw error when trying to paste beyond sheet size limit', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ])

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))

    expect(() => engine.paste(simpleCellAddress(0, Config.defaultConfig.maxColumns, 0))).toThrow(new SheetSizeLimitExceededError())
    expect(() => engine.paste(simpleCellAddress(0, 0, Config.defaultConfig.maxRows))).toThrow(new SheetSizeLimitExceededError())
  })
})

describe('isClipboardEmpty', () => {
  it('when just engine initialized', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])

    expect(engine.isClipboardEmpty()).toBe(true)
  })

  it('after copy', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isClipboardEmpty()).toBe(false)
  })

  it('after copy-paste', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    expect(engine.isClipboardEmpty()).toBe(false)
  })

  it('after cut', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isClipboardEmpty()).toBe(false)
  })

  it('after cut-paste', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    expect(engine.isClipboardEmpty()).toBe(true)
  })

  it('after clearClipboard', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1))
    engine.clearClipboard()

    expect(engine.isClipboardEmpty()).toBe(true)
  })
})
