import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('SUMSQ', () => {
  it('SUMSQ without args', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUMSQ()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('SUMSQ with args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMSQ(1, B1)', '2'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(5)
  })

  it('SUMSQ with range args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '5'],
      ['3', '4', '=SUMSQ(A1:B2)'],
    ])
    expect(engine.getCellValue(adr('C2'))).toEqual(30)
  })

  it('SUMSQ with using previously cached value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['3', '=SUMSQ(A1:A1)'],
      ['4', '=SUMSQ(A1:A2)'],
    ])
    expect(engine.getCellValue(adr('B2'))).toEqual(25)
  })

  it('doesnt do coercions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['foo'],
      ['=TRUE()'],
      ['=CONCATENATE("1","0")'],
      ['=SUMSQ(A1:A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(5)
  })

  it('range only with empty value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['', '=SUMSQ(A1:A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('range only with some empty values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['42', '', '13', '=SUMSQ(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('D1'))).toEqual(1933)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=SUMSQ(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(858)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=SUMSQ(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
