import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('COUNTA', () => {
  it('COUNTA with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=COUNTA()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('COUNTA with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=COUNTA(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('COUNTA with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=COUNTA(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('COUNTA doesnt count only empty values', () => {
    const [engine] = HyperFormula.buildFromArray([['foo'], ['=""'], [null], ['=TRUE()'], ['=COUNTA(A1:A4)']])

    expect(engine.getCellValue(adr('A5'))).toEqual(3)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=COUNTA(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(4)
  })

  it('error in ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['', ''],
      ['=COUNTA(MMULT(A1:B3, A1:B3))'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('doesnt propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=COUNTA(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(4)
  })

  it('should work with explicit error in arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTA(NA())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should work for empty arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTA(1,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2) //Compatible with product 2
  })
})
