import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function COUNTIF', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3, ">=1")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })

  it('use partial cache',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2', '=COUNTIF(A1:A3, ">=1")'],
      ['3', '=COUNTIF(A1:A4, ">=1")'],
    ])

    expect(engine.getCellValue(adr('B3'))).toEqual(2)
    expect(engine.getCellValue(adr('B4'))).toEqual(3)
    expect(engine.stats.countifPartialCacheUsed).toEqual(1)
  })

  it('use full cache',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['0', '=COUNTIF(A1:A3, ">=1")'],
      ['1', '=COUNTIF(A1:A3, ">=1")'],
      ['2'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('B2'))).toEqual(2)
    expect(engine.stats.countifFullCacheUsed).toEqual(1)
  })

  it('works for only one cell',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '=COUNTIF(A1, ">=1")'],
      ['0', '=COUNTIF(A2, ">=1")'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
  })

  it('error when 1st arg is not a range',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COUNTIF(42, ">0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when 2nd arg is not a string',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COUNTIF(C1:C2, 78)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COUNTIF(B1:B2, "><foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
