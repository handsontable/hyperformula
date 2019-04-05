import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Function COUNTIF', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3, ">=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(2)
  })

  it('use partial cache', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['0'],
      ['1'],
      ['2', '=COUNTIF(A1:A3, ">=1")'],
      ['3', '=COUNTIF(A1:A4, ">=1")'],
    ])

    expect(engine.getCellValue('B3')).toEqual(2)
    expect(engine.getCellValue('B4')).toEqual(3)
  })

  it('use full cache', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['0', '=COUNTIF(A1:A3, ">=1")'],
      ['1', '=COUNTIF(A1:A3, ">=1")'],
      ['2'],
    ])

    expect(engine.getCellValue('B1')).toEqual(2)
    expect(engine.getCellValue('B2')).toEqual(2)
  })

  it('works for only one cell', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTIF(A1, ">=1")'],
      ['0', '=COUNTIF(A2, ">=1")'],
    ])

    expect(engine.getCellValue('B1')).toEqual(1)
    expect(engine.getCellValue('B2')).toEqual(0)
  })

  it('error when 1st arg is not a range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(42, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('error when 2nd arg is not a string', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(C1:C2, 78)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(B1:B2, "%")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })
})
