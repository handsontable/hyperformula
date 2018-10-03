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

  it("#loadSheet evaluate empty vertex", () => {
    hoe.loadSheet([['=A5']])

    expect(hoe.getCellValue('A1')).toBe('0')
    expect(hoe.getCellValue('A5')).toBe('0')
  })

  it.skip("#loadSheet evaluate empty vertex", () => {
    hoe.loadSheet([['','=A1']])

    expect(hoe.getCellValue('B1')).toBe('0')
  })
  
  it("loadSheet with a loop", () => {
    expect(() => {
      hoe.loadSheet([['=B1','=C1','=A1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })

  it("#loadSheet with a loop inside plus operator", () => {
    expect(() => {
      hoe.loadSheet([['5','6','7','=A1+D1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })

  it("#loadSheet with a loop inside minus operator", () => {
    expect(() => {
      hoe.loadSheet([['5','=A1-B1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })
});
