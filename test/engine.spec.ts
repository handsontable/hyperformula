import {HandsOnEngine} from "../src";

describe('Integration', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it('#loadSheet load simple sheet', () => {
    engine.loadSheet([
      ['1']
    ])

    expect(engine.getCellValue("A1")).toBe(1)
  });

  it("#loadSheet load simple sheet", () => {
    engine.loadSheet([
      ['1', '2', '3'],
      ['4', '5', '6']
    ])

    expect(engine.getCellValue("C2")).toBe(6)
  })

  it("#loadSheet evaluate empty vertex", () => {
    engine.loadSheet([['=A5']])

    expect(engine.getCellValue('A1')).toBe(0)
    expect(engine.getCellValue('A5')).toBe(0)
  })

  it("#loadSheet evaluate empty vertex", () => {
    engine.loadSheet([['','=A1']])

    expect(engine.getCellValue('B1')).toBe(0)
  })
  
  it("loadSheet with a loop", () => {
    expect(() => {
      engine.loadSheet([['=B1','=C1','=A1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })

  it("#loadSheet with a loop inside plus operator", () => {
    expect(() => {
      engine.loadSheet([['5','=A1+B1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })

  it("#loadSheet with a loop inside minus operator", () => {
    expect(() => {
      engine.loadSheet([['5','=A1-B1']])
    }).toThrowError(new Error('Graph has a cycle'))
  })
    
  it("loadSheet with operator precedence", () => {
      engine.loadSheet([['=3*7*2-4*1+2']])
      expect(engine.getCellValue('A1')).toBe(40)
  })

  it("loadSheet with operator precedence and brackets", () => {
      engine.loadSheet([['=3*7+((2-4)*(1+2)+3)*2']])
      expect(engine.getCellValue('A1')).toBe(15)
  })
    
  it("loadSheet with operator precedence with cells", () => {
      engine.loadSheet([['3','4','=B1*2+A1',]])
      expect(engine.getCellValue('C1')).toBe(11)
  })

  it('#loadSheet change cell content', () => {
    engine.loadSheet([
      ['1', '=A1']
    ])

    engine.setCellContent('A1', '2')

    expect(engine.getCellValue("B1")).toBe(2)
  });
});
