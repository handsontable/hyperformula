import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('COUNT', () => {
  it('COUNT with empty args', () => {
    const engine = HyperFormula.buildFromArray([['=COUNT()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('COUNT with args', () => {
    const engine = HyperFormula.buildFromArray([['=COUNT(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('COUNT with range', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=COUNT(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('COUNT ignores all nonnumeric arguments', () => {
    const engine = HyperFormula.buildFromArray([['foo'], [''], ['=TRUE()'], ['=COUNT(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=COUNT(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(4)
  })

  it('error ranges doesnt count', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['', ''],
      ['=COUNT(MMULT(A1:B3, A1:B3))'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('doesnt propagate errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=COUNT(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })
})
