import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {StatType} from '../../src/statistics'
import {adr, detailedError} from '../testUtils'

describe('Function COUNTIFS', () => {
  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTIFS(B1:B3)'],
      ['=COUNTIFS(B1:B3, ">0", B1)'],
      ['=COUNTIFS(B1:B3, ">0", B1, ">1", 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIFS(A1:A3, ">=1")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })

  it('works for more criteria pairs', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '10'],
      ['2', '20'],
      ['3', '30'],
      ['=COUNTIFS(A1:A3, ">=2", B1:B3, "<=20")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('use partial cache', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2', '=COUNTIFS(A1:A3, ">=1")'],
      ['3', '=COUNTIFS(A1:A4, ">=1")'],
    ])

    expect(engine.getCellValue(adr('B3'))).toEqual(2)
    expect(engine.getCellValue(adr('B4'))).toEqual(3)
    expect(engine.getStats().get(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED)).toEqual(1)
  })

  it('use full cache', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '=COUNTIFS(A1:A3, ">=1")'],
      ['1', '=COUNTIFS(A1:A3, ">=1")'],
      ['2'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('B2'))).toEqual(2)
    expect(engine.getStats().get(StatType.CRITERION_FUNCTION_FULL_CACHE_USED)).toEqual(1)
  })

  it('works for only one cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=COUNTIFS(A1, ">=1")'],
      ['0', '=COUNTIFS(A2, ">=1")'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
  })

  it('error when criterion unparsable', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTIFS(B1:B2, "><foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadCriterion))
  })

  it('scalars are treated like singular arrays', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTIFS(10, ">1")'],
      ['=COUNTIFS(0, ">1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('error propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTIFS(4/0, ">1")'],
      ['=COUNTIFS(0, 4/0)'],
      ['=COUNTIFS(4/0, FOOBAR())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works with range values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['3', '5'],
      ['7', '9'],
      ['=COUNTIFS(A1:B2, ">4")'],
      ['=COUNTIFS(MMULT(A1:B2, A1:B2), ">50")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('works for matrices', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
      [],
      ['=COUNTIFS(A2:A3, ">0")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })

  it('ignore errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['=4/0'],
      ['1'],
      ['=COUNTIFS(A1:A3, "=1")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })
})
