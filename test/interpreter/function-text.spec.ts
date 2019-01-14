import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Text', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([['2', '=TEXT(A1, "mm/dd/yyyy")', '=TEXT(A1, "MM/DD/YYYY")']])

    expect(engine.getCellValue('B1')).toEqual('01/01/1900')
    expect(engine.getCellValue('C1')).toEqual('01/01/1900')
  })

  it('wrong number of arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=TEXT(42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('wrong format argument', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=TEXT(2, 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('wrong date argument', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=TEXT(TRUE(), "mm/dd/yyyy")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('day formats', () => {
    const engine = HandsOnEngine.buildFromArray([[
        '=DATE(2018, 8, 8)',
        '=TEXT(A1, "d")',
        '=TEXT(A1, "dd")',
        '=TEXT(A1, "ddd")',
        '=TEXT(A1, "dddd")',
    ]])

    expect(engine.getCellValue('B1')).toEqual('8')
    expect(engine.getCellValue('C1')).toEqual('08')
    expect(engine.getCellValue('D1')).toEqual('Wed')
    expect(engine.getCellValue('E1')).toEqual('Wednesday')
  })

  it('month formats', () => {
    const engine = HandsOnEngine.buildFromArray([[
      '=DATE(2018, 8, 8)',
      '=TEXT(A1, "m")',
      '=TEXT(A1, "mm")',
      '=TEXT(A1, "mmm")',
      '=TEXT(A1, "mmmm")',
      '=TEXT(A1, "mmmmm")',
    ]])

    expect(engine.getCellValue('B1')).toEqual('8')
    expect(engine.getCellValue('C1')).toEqual('08')
    expect(engine.getCellValue('D1')).toEqual('Aug')
    expect(engine.getCellValue('E1')).toEqual('August')
    expect(engine.getCellValue('F1')).toEqual('A')
  })
})
