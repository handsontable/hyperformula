import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Operator MINUS', () => {
  it('works for obvious case', () => {
    const engine = HyperFormula.buildFromArray([
      ['=8-3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
  })

  it('use number coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['="8"-"3"'],
      ['="foobar"-1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('pass error from left operand', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2-3'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from right operand', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3-A2'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from left operand if both operands have error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2-B2'],
      ['=FOOBAR()', '=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=10 - A1:A3'],
      ['8', '=A1:A3 - 10'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
  it('Minus propagates errors correctly', () => {
    const engine = HyperFormula.buildFromArray([
      ['1','2','=(1/0)-2','=2-(1/0)', '=(A1:B1)-(1/0)', '=(1/0)-(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
