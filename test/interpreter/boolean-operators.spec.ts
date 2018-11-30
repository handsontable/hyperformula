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

  it('Less than operator with number arguments', () => {
    engine.loadSheet([
        ['=1<2', '=2<2', '=-3<4', '=-4<-3'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
  })

  it('Less than operator with wrong arguments', () => {
    engine.loadSheet([
        ['=1<"foo"', '="foo"<"bar"', '=TRUE()<FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('Greater than operator with number arguments', () => {
    engine.loadSheet([
      ['=2>1', '=2>2', '=4>-3', '=-3>-4'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
  })

  it('Greater than operator with wrong arguments', () => {
    engine.loadSheet([
      ['=1>"foo"', '="foo">"bar"', '=TRUE()>FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })
})
