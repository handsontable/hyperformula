import {HandsOnEngine} from "../src";

describe('Integration', () => {
  let hoe: HandsOnEngine

  beforeEach(() => {
    hoe = new HandsOnEngine()
  })

  it('#loadSheet', () => {
    hoe.loadSheet([
      ['1']
    ])

    expect(hoe.getCellValue("A1")).toBe('1')
  });

  it("#loadSheet", () => {
    hoe.loadSheet([
      ['1', '2', '3'],
      ['4', '5', '6']
    ])

    expect(hoe.getCellValue("C2")).toBe('6')
  })

  it("#loadSheet", () => {
    hoe.loadSheet([['42', '=A1']])
    expect(hoe.getCellValue('B1')).toBe('42')
  })
});
