import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function COT', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=COT(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.642092615934331)
  })

  it('DIV/0 for zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COT(0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=COT("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=COT()', '=COT(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=COT(A1)'],
      ['', '=COT(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.642092615934331)
    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=COT(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=COT(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
