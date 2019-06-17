import {HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {MatrixVertex, FormulaCellVertex, EmptyCellVertex} from "../src/Vertex";
import {CellAddress} from "../src/parser/CellAddress"

describe('changing cell content', () => {
  it('update formula vertex', () => {
    const sheet = [
        ['1', '2', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const c1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue("C1")).toBe(1)

    engine.setCellContent(simpleCellAddress(0, 2, 0), "=B1")

    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue("C1")).toBe(2)
  })

  it('update formula to number cell vertex', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
    engine.setCellContent(simpleCellAddress(0, 1, 0), "7")
    expect(engine.getCellValue("B1")).toBe(7)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update formula to plain text cell vertex', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
    engine.setCellContent(simpleCellAddress(0, 1, 0), "foo")
    expect(engine.getCellValue("B1")).toBe("foo")
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it ('update formula to empty cell', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)

    engine.setCellContent(simpleCellAddress(0, 1, 0), '')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue("B1")).toBe(0)
  })

  it ('update value cell to formula', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    let b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '=A1')

    b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
  })

  it ('update value cell to value cell', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '3')
    expect(engine.getCellValue("B1")).toBe(3)
  })

  it ('update value cell to empty', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '')
    expect(engine.getCellValue("B1")).toBe(0)
  })

  it ('rewrite part of sheet with matrix', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['=A1', '=B1'],
      ['1', 'foo']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 2), '{=MMULT(A1:B2,A1:B2)}')
    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 2))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 3))).toBeInstanceOf(MatrixVertex)
    expect(engine.getCellValue("A3")).toBe(7)
  })


  it('#loadSheet - changing value inside range', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue('B3')).toEqual(6)

    await engine.setCellContent({ sheet: 0, col: 0, row: 0 }, '3')
    expect(engine.getCellValue('B3')).toEqual(8)
  })

  it('set formula for the first time', () => {
    const sheet = [
      ['42', '']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 1, 0), "=A1")

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      ['']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "")
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    expect(a1).toBe(null)
    expect(engine.getCellValue("A1")).toBe(0)
  })

  it('set number for the first time', () => {
    const sheet = [
      ['']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "7")

    expect(engine.getCellValue("A1")).toBe(7)
  })

  it('set text for the first time', () => {
    const sheet = [
      ['']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "foo")

    expect(engine.getCellValue("A1")).toBe("foo")
  })

  it('change empty to formula', () => {
    const sheet = [
      ['42', '', '=B1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 1, 0), "=A1")

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const c1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(42)
    expect(engine.getCellValue("C1")).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      ['', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "")

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('change EMPTY to NUMBER', () => {
    const sheet = [
      ['', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "7")

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("A1")).toBe(7)
  })

  it('change EMPTY to TEXT', () => {
    const sheet = [
      ['', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 0), "foo")

    const a1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("A1")).toBe("foo")
  })
})
