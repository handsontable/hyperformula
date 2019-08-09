import {Config, EmptyValue, HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {EmptyCellVertex, MatrixVertex} from '../src/DependencyGraph'
import './testConfig.ts'
import {adr} from "./testUtils";

describe('changing cell content', () => {
  it('update formula vertex', () => {
    const sheet = [
      ['1', '2', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
    let c1 = engine.addressMapping!.fetchCell(adr('C1'))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue('C1')).toBe(1)

    engine.setCellContent(adr('C1'), '=B1')

    c1 = engine.addressMapping!.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue('C1')).toBe(2)
  })

  it('update formula to number cell vertex', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))

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
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))

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

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const a2 = engine.addressMapping!.fetchCell(adr('B1'))
    expect(a1).toEqual(new EmptyCellVertex())
    expect(engine.graph.existsEdge(a1, a2)).toBe(true)
    expect(engine.getCellValue('A1')).toBe(EmptyValue)
  })

  it('update formula to empty cell', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(1)

    engine.setCellContent(adr('B1'), '')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue('B1')).toBe(EmptyValue)
  })

  it('update value cell to formula', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    let b1 = engine.addressMapping!.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue('B1')).toBe(2)
    engine.setCellContent(adr('B1'), '=A1')

    b1 = engine.addressMapping!.fetchCell(adr('B1'))
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

  it('update value cell to empty', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue('B1')).toBe(2)
    engine.setCellContent(adr('B1'), '')
    expect(engine.addressMapping!.getCell(adr('B1'))).toBe(null)
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
    expect(engine.addressMapping!.fetchCell(adr('A3'))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping!.fetchCell(adr('B4'))).toBeInstanceOf(MatrixVertex)
    expect(engine.getCellValue('A3')).toBe(7)
  })

  it('#loadSheet - changing value inside range', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue('B3')).toEqual(6)

    await engine.setCellContent({sheet: 0, col: 0, row: 0}, '3')
    expect(engine.getCellValue('B3')).toEqual(8)
  })

  it('set formula for the first time', () => {
    const sheet = [
      ['42', ''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('B1'), '=A1')

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('B1')).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      [''],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '')
    const a1 = engine.addressMapping!.getCell(adr('A1'))
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

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
    const c1 = engine.addressMapping!.fetchCell(adr('C1'))
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

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('change EMPTY to NUMBER', () => {
    const sheet = [
      ['', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), '7')

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue('A1')).toBe(7)
  })

  it('change EMPTY to TEXT', () => {
    const sheet = [
      ['', '=A1'],
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(adr('A1'), 'foo')

    const a1 = engine.addressMapping!.fetchCell(adr('A1'))
    const b1 = engine.addressMapping!.fetchCell(adr('B1'))
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
    const a2 = engine.addressMapping!.getCell(adr('A2'))
    const b2 = engine.addressMapping!.getCell(adr('B2'))
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
})
