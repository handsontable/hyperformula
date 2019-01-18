import {HandsOnEngine} from "../../src";
import {cellError, ErrorType} from "../../src/Cell"

describe('Function SUMPROD', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPROD(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(14)
  })

  it('works with wider ranges', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '3', '1', '3'],
      ['2', '4', '2', '4'],
      ['=SUMPROD(A1:B2,C1:D2)'],
    ])

    expect(engine.getCellValue('A3')).toEqual(30)
  })

  it('works with cached smaller range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMPROD(A1:A1, B1:B1)'],
      ['2', '2', '=SUMPROD(A1:A2, B1:B2)'],
      ['3', '3', '=SUMPROD(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(5)
    expect(engine.getCellValue('C3')).toEqual(14)
  })

  it('error when not ranges as arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=SUMPROD(42, 78)']
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('use cached value if the same formula used', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['=SUMPROD(A1:A2,B1:B2)'],
      ['=SUMPROD(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('works even if garbage in data', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['asdf', '2'],
      ['3', '3'],
      ['=SUMPROD(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })
})
