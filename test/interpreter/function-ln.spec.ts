import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function LN', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=LN(2.718281828459045)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=LN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('for zero', () => {
    const engine = HyperFormula.buildFromArray([['=LN(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('for negative arguments', () => {
    const engine = HyperFormula.buildFromArray([['=LN(-42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=LN()', '=LN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="2.718281828459045"', '=LN(A1)'],
      ['', '=LN(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=LN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=LN(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
