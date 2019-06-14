import {HandsOnEngine} from "../src";
import {simpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {MatrixVertex} from "../src/Vertex";

describe('CRUDS', () => {
  it('update formula vertex', () => {
    const sheet = [
        ['1', '2', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    const c1 = engine.addressMapping!.getCell(simpleCellAddress(0, 2, 0))

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
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

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
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

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
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

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
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    let b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '=A1')

    b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
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
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 2))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 1, 3))).toBeInstanceOf(MatrixVertex)
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
})
