import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function ACOSH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ACOSH(1)', '=ACOSH(2)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.31695789692482)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ACOSH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('too small', () => {
    const engine = HyperFormula.buildFromArray([['=ACOSH(0.9)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })


  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ACOSH()', '=ACOSH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="1"', '=ACOSH(A1)'],
      ['=TRUE()', '=ACOSH(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ACOSH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ACOSH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
