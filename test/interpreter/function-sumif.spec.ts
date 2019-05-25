import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Function SUMIF', () => {
  it('error when 1st arg is not a range or reference', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(42, ">0", B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 2nd arg is not a string', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(C1:C2, 78, B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 3rd arg is not a range or reference', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(C1:C2, ">0", 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(B1:B2, "%", C1:C2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different width dimension of arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(B1:C1, ">0", B2:D2)'],
      ['=SUMIF(B1, ">0", B2:D2)'],
      ['=SUMIF(B1:D1, ">0", B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different height dimension of arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=SUMIF(B1:B2, ">0", C1:C3)'],
      ['=SUMIF(B1, ">0", C1:C2)'],
      ['=SUMIF(B1:B2, ">0", C1)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('usage of greater than operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(7)
  })

  it('usage of greater than or equal operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">=1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(12)
  })

  it('usage of less than operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A2, "<1", B1:B2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('usage of less than or equal operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<=1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(8)
  })

  it('usage of equal operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('usage of not equal operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<>1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })

  it('works when arguments are just references', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['2', '3'],
      ['=SUMIF(A1, ">1", B1)'],
    ])

    expect(engine.getCellValue('A2')).toEqual(3)
  })

  it('works for subranges with different conditions', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"="&A1,B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"="&A2,B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"="&A3,B1:B3)'],
      ['3', '1', '=SUMIF(A1:A4,"="&A4,B1:B4)'],
      ['1', '1', '=SUMIF(A1:A5,"="&A5,B1:B5)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(1)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C4')).toEqual(1)
    expect(engine.getCellValue('C5')).toEqual(3)
  })

  it('works for subranges with inequality', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,">2",B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,">2",B1:B2)'],
      ['3', '1', '=SUMIF(A1:A3,">2",B1:B3)'],
      ['4', '1', '=SUMIF(A1:A4,">2",B1:B4)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(0)
    expect(engine.getCellValue('C2')).toEqual(0)
    expect(engine.getCellValue('C3')).toEqual(1)
    expect(engine.getCellValue('C4')).toEqual(2)
  })

  it('works for subranges with more interesting criterions', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"=1",B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"<=2",B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"<2",B1:B3)'],
      ['1', '1', '=SUMIF(A1:A4,">4",B1:B4)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(2)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C4')).toEqual(0)
  })

  it('discontinuous sumif range', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"="&A1,B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"="&A2,B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"="&A3,B1:B3)'],
      ['0', '0', '0'],
      ['1', '1', '=SUMIF(A1:A5,"="&A5,B1:B5)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(1)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C5')).toEqual(3)
  })

  it('using full cache', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
    expect(engine.getCellValue('A5')).toEqual(5)
    expect(engine.stats.sumifFullCacheUsed).toEqual(1)
  })
})
