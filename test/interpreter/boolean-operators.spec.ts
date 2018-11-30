import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Parser - Boolean operators', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it('Equals operator', () => {
    engine.loadSheet([
      ['=1=2', '=1=1', '=1+2=3'],
      ['="abc"="abc"', '="foo"="bar"', '="a"="foo"'],
      ['=TRUE()=TRUE()', '=FALSE()=FALSE()', '=TRUE()=FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toBe(false)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)

    expect(engine.getCellValue('A2')).toBe(true)
    expect(engine.getCellValue('B2')).toBe(false)
    expect(engine.getCellValue('C2')).toBe(false)

    expect(engine.getCellValue('A3')).toBe(true)
    expect(engine.getCellValue('B3')).toBe(true)
    expect(engine.getCellValue('C3')).toBe(false)
  })
})
