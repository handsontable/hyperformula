import {HandsOnEngine} from "../src";

describe('Matrix', () => {
  it('matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1','2'],
        ['3','4'],
        ['5','6'],
        ['1','2','3'],
        ['4','5','6'],
        ['=mmult(A1:B3,A4:C5)']
    ])

    expect(engine.getCellValue("A6")).toBe(9)
    expect(engine.getCellValue("B6")).toBe(12)
    expect(engine.getCellValue("C6")).toBe(15)
    expect(engine.getCellValue("A7")).toBe(19)
    expect(engine.getCellValue("B7")).toBe(26)
    expect(engine.getCellValue("C7")).toBe(33)
    expect(engine.getCellValue("A8")).toBe(29)
    expect(engine.getCellValue("B8")).toBe(40)
    expect(engine.getCellValue("C8")).toBe(51)
  })
})
