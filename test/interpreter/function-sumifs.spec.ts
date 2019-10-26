import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Function SUMIFS', () => {
  it('error when 1st arg is not a range or reference',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(42, B1:B2, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 2nd arg is not a range or reference',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(C1:C2, 42, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 3rd arg is not a string or number',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(C1:C2, B1:B2, 1/0)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 4th arg is not a range or reference',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(C1:C2, B1:B2, ">0", 42, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(B1:B2, C1:C2, "><foo")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different width dimension of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(B1:C1, B2:D2, ">0")'],
      ['=SUMIFS(B1, B2:D2, ">0")'],
      ['=SUMIFS(B1:D1, B2, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different height dimension of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(B1:B2, C1:C3, ">0")'],
      ['=SUMIFS(B1, C1:C2, ">0")'],
      ['=SUMIFS(B1:B2, C1, ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('usage of greater than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, ">1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(7)
  })

  it('usage of greater than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, ">=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(12)
  })

  it('usage of less than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B2, A1:A2, "<1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('usage of less than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, "<=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(8)
  })

  it('usage of equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, "=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('usage of not equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, "<>1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })

  it('works when arguments are just references',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['2', '3'],
      ['=SUMIFS(B1, A1, ">1")'],
    ])

    expect(engine.getCellValue('A2')).toEqual(3)
  })

  it('works for subranges with different conditions',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIFS(B1:B1, A1:A1, "="&A1)'],
      ['2', '1', '=SUMIFS(B1:B2, A1:A2, "="&A2)'],
      ['1', '1', '=SUMIFS(B1:B3, A1:A3, "="&A3)'],
      ['3', '1', '=SUMIFS(B1:B4, A1:A4, "="&A4)'],
      ['1', '1', '=SUMIFS(B1:B5, A1:A5, "="&A5)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(1)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C4')).toEqual(1)
    expect(engine.getCellValue('C5')).toEqual(3)
  })

  it('works for subranges with inequality',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIFS(B1:B1, A1:A1, ">2")'],
      ['2', '1', '=SUMIFS(B1:B2, A1:A2, ">2")'],
      ['3', '1', '=SUMIFS(B1:B3, A1:A3, ">2")'],
      ['4', '1', '=SUMIFS(B1:B4, A1:A4, ">2")'],
    ])

    expect(engine.getCellValue('C1')).toEqual(0)
    expect(engine.getCellValue('C2')).toEqual(0)
    expect(engine.getCellValue('C3')).toEqual(1)
    expect(engine.getCellValue('C4')).toEqual(2)
  })

  it('works for subranges with more interesting criterions',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIFS(B1:B1, A1:A1, "=1")'],
      ['2', '1', '=SUMIFS(B1:B2, A1:A2, "<=2")'],
      ['1', '1', '=SUMIFS(B1:B3, A1:A3, "<2")'],
      ['1', '1', '=SUMIFS(B1:B4, A1:A4, ">4")'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(2)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C4')).toEqual(0)
  })

  it('discontinuous sumif range',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIFS(B1:B1, A1:A1, "="&B1)'],
      ['2', '1', '=SUMIFS(B1:B2, A1:A2, "="&B2)'],
      ['1', '1', '=SUMIFS(B1:B3, A1:A3, "="&B3)'],
      ['0', '0', '0'],
      ['1', '1', '=SUMIFS(B1:B5, A1:A5, "="&B5)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(1)
    expect(engine.getCellValue('C3')).toEqual(2)
    expect(engine.getCellValue('C5')).toEqual(3)
  })

  it('using full cache',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIFS(B1:B3, A1:A3, "=1")'],
      ['=SUMIFS(B1:B3, A1:A3, "=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
    expect(engine.getCellValue('A5')).toEqual(5)
    expect(engine.stats.sumifFullCacheUsed).toEqual(1)
  })

  it('works for more than one criterion/range pair', () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '100', '3'],
      ['1', '101', '5'],
      ['2', '102', '7'],
      ['=SUMIFS(C1:C3, A1:A3, ">=1", B1:B3, "<102")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })
})
