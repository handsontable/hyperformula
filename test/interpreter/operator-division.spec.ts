import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe("Operator DIVISION", () => {
  it('works for obvious case', () => {
    const engine = HyperFormula.buildFromArray([
      ['=9/3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
  })

  it('returns div when dividing by zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=10/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('use number coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['="9"/"3"'],
      ['="foobar"/1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('pass error from left operand', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2/3'],
      ['=FOOBAR()']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('pass error from right operand', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3/A2'],
      ['=FOOBAR()']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('pass error from left operand if both operands have error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2/B2'],
      ['=FOOBAR()', '=4/0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=10 / A1:A3'],
      ['9', '=A1:A3 / 10'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
