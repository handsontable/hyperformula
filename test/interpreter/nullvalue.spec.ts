import {CellError, EmptyValue, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'

describe('BLANK tests', () => {
  it('BLANK should be supported by all comparison operators', () => {
    const engine = HyperFormula.buildFromArray(
      [
        [null, null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
      ])

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(0) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(0) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(0) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new CellError(ErrorType.NUM)) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual(EmptyValue) // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(0) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(0) // UNARY MINUS
    expect(engine.getCellValue(adr('R1'))).toEqual(0) // PERCENTAGE
  })
})
