import {HandsOnEngine} from "../src";

describe('Integration', () => {
  let hoe: HandsOnEngine

  beforeEach(() => {
    hoe = new HandsOnEngine()
  })

  it('#loadSheet load simple sheet', () => {
    hoe.loadSheet([
      ['1']
    ])

    expect(hoe.getCellValue("A1")).toBe('1')
  });

  it("#loadSheet load simple sheet", () => {
    hoe.loadSheet([
      ['1', '2', '3'],
      ['4', '5', '6']
    ])

    expect(hoe.getCellValue("C2")).toBe('6')
  })

  it("#loadSheet evaluate relative addressing formula", () => {
    hoe.loadSheet([['42', '=A1']])

    expect(hoe.getCellValue('B1')).toBe('42')
  })

  it("#loadSheet evaluate sum operator", () => {
    hoe.loadSheet([['3', '7', '=A1+B1']])

    expect(hoe.getCellValue('C1')).toBe('10')
  })

  it("#loadSheet evaluate sum operator", () => {
    hoe.loadSheet([['3', '=A1+42']])

    expect(hoe.getCellValue('B1')).toBe('45')
  })
});
