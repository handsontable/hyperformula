import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('MAXA', () => {
  it('MAXA with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MAXA()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('MAXA with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MAXA(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(3.14)
  })

  it('MAXA with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MAXA(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('does only boolean coercions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="42"', '=MAXA(A1)'],
      ['=TRUE()', '=MAXA(A2)'],
      ['=FALSE()', '=MAXA(A3)'],
      ['="TRUE"', '=MAXA(A4)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('B4'))).toEqual(0)
  })

  it('MAXA of strings and -1', () => {
    const [engine] = HyperFormula.buildFromArray([['foo'], ['bar'], ['-1'], ['=MAXA(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('MAXA of empty value', () => {
    const [engine] = HyperFormula.buildFromArray([['', '=MAXA(A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('MAXA of empty value and some negative number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['', '-1', '=MAXA(A1,B1)'],
      [null, '-1', '=MAXA(A2,B2)'],
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
    expect(engine.getCellValue(adr('C2'))).toEqual(-1)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=MAXA(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(22)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=MAXA(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
