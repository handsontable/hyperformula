import {HandsOnEngine} from "../src";

describe('Interpreter', () => {
  let hoe: HandsOnEngine

  beforeEach(() => {
    hoe = new HandsOnEngine()
  })

  it("relative addressing formula", () => {
    hoe.loadSheet([['42', '=A1']])

    expect(hoe.getCellValue('B1')).toBe('42')
  })

  it("number literal", () => {
    hoe.loadSheet([['3']])

    expect(hoe.getCellValue('A1')).toBe('3')
  })

  it("plus operator", () => {
    hoe.loadSheet([['3', '7', '=A1+B1']])

    expect(hoe.getCellValue('C1')).toBe('10')
  })

  it("plus operator", () => {
    hoe.loadSheet([['3', '=A1+42']])

    expect(hoe.getCellValue('B1')).toBe('45')
  })

  it("minus operator", () => {
    hoe.loadSheet([['3', '=A1-43']])

    expect(hoe.getCellValue('B1')).toBe('-40')
  })

  it("times operator", () => {
    hoe.loadSheet([['3', '=A1*6']])

    expect(hoe.getCellValue('B1')).toBe('18')
  })
});
