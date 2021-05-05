import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError, detailedErrorWithOrigin} from './testUtils'

describe('without arrayformula, with arrays flag', () => {
  it('unary op, scalar ret', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=SUM(-A1:C1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('unary op, array ret', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=-A1:C1']], {arrays: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [-1, -2, -3]])
  })

  it('binary op, scalar ret', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=SUM(2*A1:C1+A2:C2)']], {arrays: true})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('binary op, array ret', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=2*A1:C1+A2:C2']], {arrays: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [4, 5, 6], [6, 9, 12]])
  })

  it('binary op, array ret, concat', () => {
    const engine = HyperFormula.buildFromArray([['a', 'b', 'c'], ['d', 'e', 'f'], ['=A1:C1&A2:C2']], {arrays: true})
    expect(engine.getSheetValues(0)).toEqual([['a', 'b', 'c'], ['d', 'e', 'f'], ['ad', 'be', 'cf']])
  })

  it('index', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=INDEX(2*A1:C1+3,1,1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('binary op + index', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=INDEX(A1:C2+A1:B3,1,1)', '=INDEX(A1:C2+A1:B3,1,2)', '=INDEX(A1:C2+A1:B3,1,3)'],
      ['=INDEX(A1:C2+A1:B3,2,1)', '=INDEX(A1:C2+A1:B3,2,2)', '=INDEX(A1:C2+A1:B3,2,3)'],
      ['=INDEX(A1:C2+A1:B3,3,1)', '=INDEX(A1:C2+A1:B3,3,2)', '=INDEX(A1:C2+A1:B3,3,3)'],
    ], {arrays: true})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      [2, 4, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C4')],
      [8, 10, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C5')],
      [detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!B6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C6')]])
  })

  it('match', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(10,2*A2:E2)'],
      [1, 2, 3, 4, 5],
    ], {arrays: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
})

describe('without arrayformula, without arrays flag', () => {
  it('unary op', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=SUM(-A1:C1)']], {arrays: false})
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('binary op', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=SUM(2*A1:C1+A2:C2)']], {arrays: false})
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('index', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=INDEX(2*A1:C1+3,1,1)']], {arrays: false})
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('binary op + index', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=INDEX(A1:C2+A1:B3,1,1)', '=INDEX(A1:C2+A1:B3,1,2)', '=INDEX(A1:C2+A1:B3,1,3)'],
      ['=INDEX(A1:C2+A1:B3,2,1)', '=INDEX(A1:C2+A1:B3,2,2)', '=INDEX(A1:C2+A1:B3,2,3)'],
      ['=INDEX(A1:C2+A1:B3,3,1)', '=INDEX(A1:C2+A1:B3,3,2)', '=INDEX(A1:C2+A1:B3,3,3)'],
    ], {arrays: false})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A4', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B4', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C4', ErrorMessage.ScalarExpected)],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A5', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B5', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C5', ErrorMessage.ScalarExpected)],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A6', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B6', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C6', ErrorMessage.ScalarExpected)]
      ])
  })

  it('match', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(10,2*A2:E2)'],
      [1, 2, 3, 4, 5],
    ], {arrays: false})
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })
})

describe('with arrayformula, without arrays flag', () => {
  it('unary op', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=ARRAYFORMULA(SUM(-A1:C1))']], {arrays: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('unary op #2', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=SUM(ARRAYFORMULA(-A1:C1))']], {arrays: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('binary op', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=ARRAYFORMULA(SUM(2*A1:C1+A2:C2))']], {arrays: false})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('binary op #2', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=SUM(ARRAYFORMULA(2*A1:C1+A2:C2))']], {arrays: false})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('index', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], ['=ARRAYFORMULA(INDEX(2*A1:C1+3,1,1))']], {arrays: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('binary op + index', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,3))'],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,3))'],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,3))'],
    ], {arrays: false})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 4, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C4')],
        [8, 10, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C5')],
        [detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!B6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C6')]])
  })

  it('match', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ARRAYFORMULA(MATCH(10,2*A2:E2))'],
      [1, 2, 3, 4, 5],
    ], {arrays: false})
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
})

describe('coercion of array to scalar', () => {
  it('actual range', () => {
    const engine = HyperFormula.buildFromArray([[0,2,3],['=SIN(A1:C1)']])
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('ad-hoc array + function', () => {
    const engine = HyperFormula.buildFromArray([[0,2,3],['=SIN(ARRAYFORMULA(2*A1:C1))']])
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('ad-hoc array + binary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=ARRAYFORMULA(2*A1:C1)+ARRAYFORMULA(2*A1:C1)']])
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
  })

  it('ad-hoc array + unary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=-ARRAYFORMULA(2*A1:C1)']])
    expect(engine.getCellValue(adr('A2'))).toEqual(-2)
  })
})

