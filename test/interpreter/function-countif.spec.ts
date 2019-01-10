import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Function COUNTIF', () => {
  it('function COUNTIF usage', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3, ">=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(2)
  })

  it('function COUNTIF error when 1st arg is not a range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(42, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function COUNTIF error when 2nd arg is not a string', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(C1:C2, 78)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function COUNTIF error when criterion unparsable', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTIF(B1:B2, "%")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })
})
