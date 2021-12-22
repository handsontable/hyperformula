import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('COUNT', () => {
  it('COUNT with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([['=COUNT()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('COUNT with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=COUNT(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('COUNT with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=COUNT(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('COUNT ignores all nonnumeric arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['foo'], [null], ['=TRUE()'], ['=COUNT(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('over a range value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=COUNT(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(4)
  })

  it('error in ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['', ''],
      ['=COUNT(MMULT(A1:B3, A1:B3))'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('doesnt propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=COUNT(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('should work with explicit error in arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNT(NA())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('should work for empty arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNT(1,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })
})
