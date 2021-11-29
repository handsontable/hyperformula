import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('MIN', () => {
  it('MIN with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MIN()']])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('MIN with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=MIN(1, B1)', '3.14']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('MIN with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('MIN with mixed arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MIN(4,A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('MIN of strings and number', () => {
    const [engine] = HyperFormula.buildFromArray([['foo'], ['bar'], ['5'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('doesnt do coercions', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['foo'],
      ['=TRUE()'],
      ['=CONCATENATE("1","0")'],
      ['=MIN(A1:A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(1)
  })

  it('MIN of empty value', () => {
    const [engine] = HyperFormula.buildFromArray([['', '=MIN(A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('MIN of empty value and some negative number', () => {
    const [engine] = HyperFormula.buildFromArray([['', '1', '=MIN(A1,B1)']])
    expect(engine.getCellValue(adr('C1'))).toEqual(1)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=MIN(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(7)
  })

  it('propagates errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=MIN(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
