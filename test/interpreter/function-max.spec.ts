import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('MAX', () => {
  it('MAX with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MAX()']])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('MAX with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MAX(1, B1)', '3.14']])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(3.14)
  })

  it('MAX with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MAX(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('MAX with mixed arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MAX(4,A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('doesnt do coercions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['foo'],
      ['=TRUE()'],
      ['=CONCATENATE("1","0")'],
      ['=MAX(A1:A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(2)
  })

  it('MAX of strings and -1', () => {
    const [engine] = HyperFormula.buildFromArray([['foo'], ['bar'], ['-1'], ['=MAX(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(-1)
  })

  it('MAX of empty value', () => {
    const [engine] = HyperFormula.buildFromArray([['', '=MAX(A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('MAX of empty value and some negative number', () => {
    const [engine] = HyperFormula.buildFromArray([['', '-1', '=MAX(A1,B1)']])
    expect(engine.getCellValue(adr('C1'))).toEqual(-1)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=MAX(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(22)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=MAX(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
