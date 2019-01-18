import {HandsOnEngine} from "../../src";

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

  it('works', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPROD(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(14)
  })
})