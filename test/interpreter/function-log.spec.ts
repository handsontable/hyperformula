import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOG', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(4, 2)']])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
  })

  it('logarithmic base has default', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(10)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LOG("foo", 42)'],
      ['=LOG(42, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('for zero', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(0, 42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('for negative value', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(-42, 42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('for zero base', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(42, 0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('for 1 base', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(42, 1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('for negative base', () => {
    const engine = HyperFormula.buildFromArray([['=LOG(42, -42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=LOG()', '=LOG(42, 42, 42)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="10"', '=LOG(A1, 10)', '=LOG(10, A1)'],
      ['', '=LOG(A2, 42)', '=LOG(42, 0)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('C1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=LOG(4/0, 42)'],
      ['=LOG(42, 4/0)'],
      ['=LOG(4/0, FOOBAR())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=LOG(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
