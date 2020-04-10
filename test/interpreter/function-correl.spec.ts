import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('CORREL', () => {
  it('validates number of arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=CORREL()'],
      ['=CORREL(B1:B5, C1:C5, D1:D5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('ranges need to have same amount of elements',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=CORREL(B1:B5, C1:C6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works (simple)',  () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '10'],
      ['2', '20'],
      ['=CORREL(A1:A2, B1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toBe(1)
  })

  it('works',  () => {
    const engine = HyperFormula.buildFromArray([
      ['2', '4'],
      ['5', '3'],
      ['7', '6'],
      ['1', '1'],
      ['8', '5'],
      ['=CORREL(A1:A5, B1:B5)']
    ])

    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(0.7927032095)
  })

  it('error when not enough data',  () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=CORREL(A1:A1, B1:B1)'],
      ['=CORREL(42, 43)'],
      ['=CORREL("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('doesnt do coercions, nonnumeric values are skipped',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', '10'],
      ['="2"', '50'],
      ['3', '30'],
      ['=CORREL(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['=CORREL(MMULT(A1:B2, A1:B2), MMULT(B1:C2, B1:C2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.999248091927219)
  })

  it('propagates errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '10'],
      ['=4/0', '50'],
      ['3', '30'],
      ['=CORREL(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
