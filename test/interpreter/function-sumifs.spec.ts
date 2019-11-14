import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe('Function SUMIFS', () => {
  it('requires odd number of arguments, but at least 3', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(C1, ">0")'],
      ['=SUMIFS(C1, ">0", B1, B1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('error when criterion arg is not a string or number',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(C1:C2, B1:B2, 42)'],
      ['=SUMIFS(C1:C2, B1:B2, "=1", B1:B2, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(B1:B2, C1:C2, "><foo")'],
      ['=SUMIFS(B1:B2, C1:C2, "=1", C1:C2, "><foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different width dimension of arguments',  () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUMIFS(B1:C1, B2:D2, ">0")'],
      ['=SUMIFS(B1, B2:D2, ">0")'],
      ['=SUMIFS(B1:D1, B2, ">0")'],
      ['=SUMIFS(B1:D1, B2:D2, ">0", B2:E2, ">0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A4'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when different height dimension of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(B1:B2, C1:C3, ">0")'],
      ['=SUMIFS(B1, C1:C2, ">0")'],
      ['=SUMIFS(B1:B2, C1, ">0")'],
      ['=SUMIFS(B1:B2, C1:C2, ">0", C1:C3, ">0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A4'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('scalars are treated like singular arrays', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(42, 10, ">1")'],
      ['=SUMIFS(42, 0, ">1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('error propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SUMIFS(4/0, 42, ">1")'],
      ['=SUMIFS(0, 4/0, ">1")'],
      ['=SUMIFS(0, 42, 4/0)'],
      ['=SUMIFS(0, 4/0, FOOBAR())'],
      ['=SUMIFS(4/0, FOOBAR(), ">1")'],
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
      ['=SUMIFS(B1, A1, ">1")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('works with range values', () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '1', '3', '5'],
      ['1', '1', '7', '9'],
      ['=SUMIFS(MMULT(C1:D2, C1:D2), MMULT(A1:B2, A1:B2), "=2")'],
      ['=SUMIFS(MMULT(C1:D2, C1:D2), A1:B2, "=1")'],
      ['=SUMIFS(C1:D2, MMULT(A1:B2, A1:B2), "=2")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(304)
    expect(engine.getCellValue(adr('A4'))).toEqual(304)
    expect(engine.getCellValue(adr('A5'))).toEqual(24)
  })

  it('works for mixed reference/range arguments', () => {
    const engine =  HyperFormula.buildFromArray([
      ['2', '3'],
      ['=SUMIFS(B1, A1:A1, ">1")'],
      ['4', '5'],
      ['=SUMIFS(B3:B3, A3, ">1")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('works for more than one criterion/range pair', () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '100', '3'],
      ['1', '101', '5'],
      ['2', '102', '7'],
      ['=SUMIFS(C1:C3, A1:A3, ">=1", B1:B3, "<102")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })
})
