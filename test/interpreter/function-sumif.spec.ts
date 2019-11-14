import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe('Function SUMIF', () => {
  it('requires 2 or 3 arguments', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(C1)'],
      ['=SUMIF(C1, ">0", C1, C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NA))
  })

  it('error when 2nd arg is not a string',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(C1:C2, 78, B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(B1:B2, "><foo", C1:C2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different width dimension of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(B1:C1, ">0", B2:D2)'],
      ['=SUMIF(B1, ">0", B2:D2)'],
      ['=SUMIF(B1:D1, ">0", B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different height dimension of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(B1:B2, ">0", C1:C3)'],
      ['=SUMIF(B1, ">0", C1:C2)'],
      ['=SUMIF(B1:B2, ">0", C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when number of elements match but dimensions doesnt',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(B1:B2, ">0", B1:C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('scalars are treated like singular arrays', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(10, ">1", 42)'],
      ['=SUMIF(0, ">1", 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('error propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIF(4/0, ">1", 42)'],
      ['=SUMIF(0, 4/0, 42)'],
      ['=SUMIF(0, ">1", 4/0)'],
      ['=SUMIF(0, 4/0, FOOBAR())'],
      ['=SUMIF(4/0, FOOBAR(), 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('works when arguments are just references',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['2', '3'],
      ['=SUMIF(A1, ">1", B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('no coercion when sum', () => {
    const engine =  HyperFormula.buildFromArray([
      ['2', '="3"'],
      ['=SUMIF(A1, ">1", B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('works for mixed reference/range arguments', () => {
    const engine =  HyperFormula.buildFromArray([
      ['2', '3'],
      ['=SUMIF(A1:A1, ">1", B1)'],
      ['=SUMIF(A1, ">1", B1:B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('works with range values', () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '3', '5'],
      ['1', '1', '7', '9'],
      ['=SUMIF(MMULT(A1:B2, A1:B2), "=2", MMULT(C1:D2, C1:D2))'],
      ['=SUMIF(A1:B2, "=1", MMULT(C1:D2, C1:D2))'],
      ['=SUMIF(MMULT(A1:B2, A1:B2), "=2", C1:D2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(304)
    expect(engine.getCellValue(adr('A4'))).toEqual(304)
    expect(engine.getCellValue(adr('A5'))).toEqual(24)
  })

  it('works for subranges with different conditions',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"="&A1,B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"="&A2,B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"="&A3,B1:B3)'],
      ['3', '1', '=SUMIF(A1:A4,"="&A4,B1:B4)'],
      ['1', '1', '=SUMIF(A1:A5,"="&A5,B1:B5)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('C2'))).toEqual(1)
    expect(engine.getCellValue(adr('C3'))).toEqual(2)
    expect(engine.getCellValue(adr('C4'))).toEqual(1)
    expect(engine.getCellValue(adr('C5'))).toEqual(3)
  })

  it('works for subranges with inequality',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,">2",B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,">2",B1:B2)'],
      ['3', '1', '=SUMIF(A1:A3,">2",B1:B3)'],
      ['4', '1', '=SUMIF(A1:A4,">2",B1:B4)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(0)
    expect(engine.getCellValue(adr('C2'))).toEqual(0)
    expect(engine.getCellValue(adr('C3'))).toEqual(1)
    expect(engine.getCellValue(adr('C4'))).toEqual(2)
  })

  it('works for subranges with more interesting criterions',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"=1",B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"<=2",B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"<2",B1:B3)'],
      ['1', '1', '=SUMIF(A1:A4,">4",B1:B4)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('C2'))).toEqual(2)
    expect(engine.getCellValue(adr('C3'))).toEqual(2)
    expect(engine.getCellValue(adr('C4'))).toEqual(0)
  })

  it('discontinuous sumif range',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '=SUMIF(A1:A1,"="&A1,B1:B1)'],
      ['2', '1', '=SUMIF(A1:A2,"="&A2,B1:B2)'],
      ['1', '1', '=SUMIF(A1:A3,"="&A3,B1:B3)'],
      ['0', '0', '0'],
      ['1', '1', '=SUMIF(A1:A5,"="&A5,B1:B5)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('C2'))).toEqual(1)
    expect(engine.getCellValue(adr('C3'))).toEqual(2)
    expect(engine.getCellValue(adr('C5'))).toEqual(3)
  })

  it('using full cache',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
    expect(engine.getCellValue(adr('A5'))).toEqual(5)
    expect(engine.stats.sumifFullCacheUsed).toEqual(1)
  })

  it('works with different sheets',  () => {
    const engine =  HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '3'],
        ['1', '5'],
        ['2', '7'],
        ['=SUMIF(A1:A3, "=1", B1:B3)'],
        ['=SUMIF($Sheet2.A1:A3, "=1", B1:B3)'],
      ],
      Sheet2: [
        ['0', '30'],
        ['0', '50'],
        ['1', '70'],
        ['=SUMIF(A1:A3, "=1", B1:B3)'],
      ],
    })

    expect(engine.getCellValue(adr('A4', 0))).toEqual(5)
    expect(engine.getCellValue(adr('A5', 0))).toEqual(7)
    expect(engine.getCellValue(adr('A4', 1))).toEqual(70)
    expect(engine.stats.sumifFullCacheUsed).toEqual(0)
  })
})

describe('Criterions - operators computations', () => {
  it('usage of greater than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(7)
  })

  it('usage of greater than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, ">=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(12)
  })

  it('usage of less than operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A2, "<1", B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('usage of less than or equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(8)
  })

  it('usage of equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "=1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('usage of not equal operator',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3, "<>1", B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(10)
  })
})
