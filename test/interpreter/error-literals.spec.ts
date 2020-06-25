import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Error literals', () => {
  it('Errors should be parsed and propagated', () => {
    const engine = HyperFormula.buildFromArray([
      ['#DIV/0!', '=A1', '=#DIV/0!'],
      ['=ISERROR(A1)', '=ISERROR(B1)', '=ISERROR(C1)', '=ISERROR(#DIV/0!)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(true)
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
    expect(engine.getCellValue(adr('C2'))).toEqual(true)
  })

  it('should return error when unknown error literal in formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['#UNKNOWN!', '=#UNKNOWN!']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('#UNKNOWN!')
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })

  it( 'error #N/A! with every combination should be supported by all comparison operators', () => {
    const engine = HyperFormula.buildFromArray([
      [ '#N/A', 0, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA)) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA)) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.NA)) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.NA)) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(detailedError(ErrorType.NA)) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(detailedError(ErrorType.NA)) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(detailedError(ErrorType.NA)) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(detailedError(ErrorType.NA)) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(detailedError(ErrorType.NA)) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(detailedError(ErrorType.NA)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(detailedError(ErrorType.NA)) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual(detailedError(ErrorType.NA)) // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(detailedError(ErrorType.NA)) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(detailedError(ErrorType.NA)) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toEqual(detailedError(ErrorType.NA)) // PERCENTAGE
  })

  it( 'error #DIV/0! with every combination should be supported by all comparison operators', () => {
    const engine = HyperFormula.buildFromArray([
      [ '#DIV/0!', null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) //ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) //SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) //MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO)) // PERCENTAGE
  })

  it( 'error #CYCLE! with every combination should be supported by all comparison operators', () => {
    const engine = HyperFormula.buildFromArray([
      [ '#CYCLE!', null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.CYCLE))  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.CYCLE)) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.CYCLE)) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(detailedError(ErrorType.CYCLE)) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(detailedError(ErrorType.CYCLE)) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(detailedError(ErrorType.CYCLE)) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(detailedError(ErrorType.CYCLE)) //ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(detailedError(ErrorType.CYCLE)) //SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(detailedError(ErrorType.CYCLE)) //MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(detailedError(ErrorType.CYCLE)) // DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(detailedError(ErrorType.CYCLE)) // EXP
    expect(engine.getCellValue(adr('N1'))).toEqual(detailedError(ErrorType.CYCLE)) // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(detailedError(ErrorType.CYCLE)) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(detailedError(ErrorType.CYCLE)) // UNARY MINUS
    expect(engine.getCellValue(adr('Q1'))).toEqual(detailedError(ErrorType.CYCLE)) // PERCENTAGE
  })
})
