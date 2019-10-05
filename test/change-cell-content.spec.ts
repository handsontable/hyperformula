import {Config, EmptyValue, HandsOnEngine, InvalidAddressError, NoSuchSheetError} from '../src'
import {EmptyCellVertex, MatrixVertex} from '../src/DependencyGraph'
import './testConfig.ts'
import {adr} from './testUtils'

describe('changing cell content', () => {
  it('update formula vertex', () => {
    const sheet = [
      ['1', '2', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    let c1 = engine.addressMapping.fetchCell(adr('C1'))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue('C1')).toBe(1)

    engine.setCellContent(adr('C1'), '=B1')

    c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue('C1')).toBe(2)
  })

  it('update formula to number cell vertex', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(1)
    engine.setCellContent(adr('B1'), '7')
    expect(engine.getCellValue('B1')).toBe(7)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update formula to plain text cell vertex', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(1)
    engine.setCellContent(adr('B1'), 'foo')
    expect(engine.getCellValue('B1')).toBe('foo')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('set vertex with edge to empty cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
    ])

    engine.setCellContent(adr('A1'), '')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toEqual(new EmptyCellVertex())
    expect(engine.graph.existsEdge(a1, a2)).toBe(true)
    expect(engine.getCellValue('A1')).toBe(EmptyValue)
  })

  it('update formula to empty cell', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(1)

    engine.setCellContent(adr('B1'), '')
    expect(engine.getCellValue('B1')).toBe(EmptyValue)
    expect(engine.graph.nodes).not.toContain(b1)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update value cell to formula', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    let b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue('B1')).toBe(2)
    engine.setCellContent(adr('B1'), '=A1')

    b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(1)
  })

  it('update value cell to value cell', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue('B1')).toBe(2)
    engine.setCellContent(adr('B1'), '3')
    expect(engine.getCellValue('B1')).toBe(3)
  })

  it('update value cell to value cell with the same value', () => {
    const sheet = [
      ['1', '2', '=SUM(A1:B1)'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const b1setCellValueSpy = jest.spyOn(b1 as any, 'setCellValue')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.setCellContent(adr('B1'), '2')

    expect(b1setCellValueSpy).not.toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('update value cell to empty', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue('B1')).toBe(2)
    engine.setCellContent(adr('B1'), '')
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(null)
    expect(engine.getCellValue('B1')).toBe(EmptyValue)
  })

  it('rewrite part of sheet with matrix', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['=A1', ''],
      ['1', 'foo'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A3'), '{=MMULT(A1:B2,A1:B2)}')
    expect(engine.addressMapping.fetchCell(adr('A3'))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping.fetchCell(adr('B4'))).toBeInstanceOf(MatrixVertex)
    expect(engine.getCellValue('A3')).toBe(7)
  })

  it('#loadSheet - changing value inside range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue('B3')).toEqual(6)

    engine.setCellContent({sheet: 0, col: 0, row: 0}, '3')
    expect(engine.getCellValue('B3')).toEqual(8)
  })

  it('set formula for the first time', () => {
    const sheet = [
      ['42', ''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      [''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '')
    const a1 = engine.addressMapping.getCell(adr('A1'))
    expect(a1).toBe(null)
    expect(engine.getCellValue('A1')).toBe(EmptyValue)
  })

  it('set number for the first time', () => {
    const sheet = [
      [''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '7')

    expect(engine.getCellValue('A1')).toBe(7)
  })

  it('set text for the first time', () => {
    const sheet = [
      [''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), 'foo')

    expect(engine.getCellValue('A1')).toBe('foo')
  })

  it('change empty to formula', () => {
    const sheet = [
      ['42', '', '=B1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(42)
    expect(engine.getCellValue('C1')).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      ['', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('change EMPTY to NUMBER', () => {
    const sheet = [
      ['', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '7')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('A1')).toBe(7)
  })

  it('change EMPTY to TEXT', () => {
    const sheet = [
      ['', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), 'foo')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('A1')).toBe('foo')
  })

  it('change numeric value inside matrix to another number', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('A1')).toBe(1)
    engine.setCellContent(adr('A1'), '5')
    expect(engine.getCellValue('A1')).toBe(5)
  })

  it('change numeric value inside matrix to NaN', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('A1')).toBe(1)

    expect(() => {
      engine.setCellContent(adr('A1'), 'foo')
    }).toThrowError('Illegal operation')
  })

  it('ensure that only part of the tree is evaluated', () => {
    const sheet = [
      ['1', '2'],
      ['=A1', '=B1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const b2 = engine.addressMapping.getCell(adr('B2'))
    const a2setCellValueSpy = jest.spyOn(a2 as any, 'setCellValue')
    const b2setCellValueSpy = jest.spyOn(b2 as any, 'setCellValue')

    engine.setCellContent(adr('A1'), '3')
    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(b2setCellValueSpy).not.toHaveBeenCalled()
  })

  it('should not be possible to edit part of a Matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['', '{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.setCellContent(adr('A2'), '{=TRANSPOSE(C1:C2)}')
    }).toThrow('You cannot modify only part of an array')
  })

  it('is not recomputed if user doesnt want it', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=B1'],
    ])

    engine.setCellContent(adr('B1'), '3', false)

    expect(engine.getCellValue('C1')).toBe(2)
  })

  it('it not possible to set cell content in sheet which does not exist', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(() => {
      engine.setCellContent(adr('B1', 1), '3')
    }).toThrow(new NoSuchSheetError(1))
  })

  it('it not possible to set cell content with invalid address', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    const address = { row: -1, col: 0, sheet: 0 }
    expect(() => {
      engine.setCellContent(address, '3')
    }).toThrow(new InvalidAddressError(address))
  })

  it('remembers if the new formula is structure dependent', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '=TRUE()'],
      ['1'],
    ])

    engine.setCellContent(adr('C1'), '=COLUMNS(A1:B1)')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')
    engine.removeRows(0, 1, 1)

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })
})

describe('change multiple cells contents', () => {
  it('works for one', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setMultipleCellContents(adr('B1'), [['3']])
    expect(engine.getCellValue('B1')).toBe(3)
  })

  it('works for many', () => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setMultipleCellContents(adr('B1'), [
      ['12', '13'],
      ['15', '16'],
      ['18', '19'],
    ])
    expect(engine.getCellValue('B1')).toBe(12)
    expect(engine.getCellValue('C1')).toBe(13)
    expect(engine.getCellValue('B2')).toBe(15)
    expect(engine.getCellValue('C2')).toBe(16)
    expect(engine.getCellValue('B3')).toBe(18)
    expect(engine.getCellValue('C3')).toBe(19)
  })

  it('recompute only once', () => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const evaluatorCallSpy = jest.spyOn(engine.evaluator as any, 'partialRun')

    engine.setMultipleCellContents(adr('B1'), [
      ['12', '13'],
      ['15', '16'],
      ['18', '19'],
    ])

    expect(evaluatorCallSpy).toHaveBeenCalledTimes(1)
  })

  it('it not possible to change matrices', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(() => {
      engine.setMultipleCellContents(adr('A1'), [['42', '{=MMULT(A1:B2,A1:B2)}']])
    }).toThrow('Cant change matrices in batch operation')
    expect(engine.getCellValue('A1')).toBe(1)
  })
})
