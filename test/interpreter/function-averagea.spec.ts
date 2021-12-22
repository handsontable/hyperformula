import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('AVERAGEA', () => {
  it('AVERAGEA with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=AVERAGEA()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('AVERAGEA with args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEA(1, B1)', '4']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2.5)
  })

  it('AVERAGEA with range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['4'],
      ['=AVERAGEA(A1:A3)']
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(2.333333333)
  })

  it('AVERAGEA converts non-blank values to numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['39', '="1"', '=AVERAGEA(A1:B1)'],
      ['39', '=TRUE()', '=AVERAGEA(A2:B2)'],
      ['39', null, '=AVERAGEA(A3:B3)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(19.5)
    expect(engine.getCellValue(adr('C2'))).toEqual(20)
    expect(engine.getCellValue(adr('C3'))).toEqual(39)
  })

  it('error when no meaningful arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, 'foo'],
      [null, null],
      ['=AVERAGEA(A1:A2)', '=AVERAGEA(B1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=AVERAGEA(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(13.5)
  })

  it('does propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=AVERAGEA(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
