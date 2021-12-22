import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('EmptyValue tests', () => {
  it('EmptyValue vs EmptyValue tests', () => {
    const [engine] = HyperFormula.buildFromArray(
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
    expect(engine.getCellValue(adr('L1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(1) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toBe(null) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(0) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toEqual(0) // PERCENTAGE
  })

  it('Boolean vs EmptyValue tests', () => {
    const [engine] = HyperFormula.buildFromArray(
      [
        ['=TRUE()', null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
      ])
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(1) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(1) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(0) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(1) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('TRUE') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(true) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(-1) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toEqual(0.01) // PERCENTAGE
  })
})
