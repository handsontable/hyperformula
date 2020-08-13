import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function ATANH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ATANH(0)', '=ATANH(0.5)']], { smartRounding : false})

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.5493061443340548)
  })

  it('error for 1', () => {
    const engine = HyperFormula.buildFromArray([['=ATANH(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('error for -1', () => {
    const engine = HyperFormula.buildFromArray([['=ATANH(-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ATANH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ATANH()', '=ATANH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="0"', '=ATANH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ATANH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ATANH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
