import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('EmptyValue tests', () => {
  it('EmptyValue vs EmptyValue tests', () => {
    const engine = HyperFormula.buildFromArray(
      [
        [null, null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
      ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toBe(false) // GT
    expect(engine.getCellValue(adr('E1'))).toBe(false) // LT
    expect(engine.getCellValue(adr('F1'))).toBe(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toBe(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toBe(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toBe(0) // ADD
    expect(engine.getCellValue(adr('J1'))).toBe(0) // SUB
    expect(engine.getCellValue(adr('K1'))).toBe(0) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toBe(1) // EXP
    expect(engine.getCellValue(adr('N1'))).toBe('') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toBeNull() // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toBe(0) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toBe(0) // PERCENTAGE
  })

  it('Boolean vs EmptyValue tests', () => {
    const engine = HyperFormula.buildFromArray(
      [
        ['=TRUE()', null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
      ])

    expect(engine.getCellValue(adr('C1'))).toBe(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toBe(true) // GT
    expect(engine.getCellValue(adr('E1'))).toBe(false) // LT
    expect(engine.getCellValue(adr('F1'))).toBe(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toBe(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toBe(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toBe(1) // ADD
    expect(engine.getCellValue(adr('J1'))).toBe(1) // SUB
    expect(engine.getCellValue(adr('K1'))).toBe(0) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toBe(1) // EXP
    expect(engine.getCellValue(adr('N1'))).toBe('TRUE') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toBe(true) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toBe(-1) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toBe(0.01) // PERCENTAGE
  })
})
