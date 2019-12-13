import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe("Function COS", () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=COS(0)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=COS("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=COS()', '=COS(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=COS(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.54030230586814)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=COS(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
