import {HyperFormula} from '../src'
import {CellValueDetailedType} from '../src/Cell'
import {adr} from './testUtils'

describe('arithmetic operations', () => {
  it('addition should correctly infer types', () => {
    const engine = HyperFormula.buildFromArray([
      ['1','1%','1$','01/01/1900','12:00','01/01/1900 12:00'],
      ['=A1+A1', '=A1+B1', '=A1+C1', '=A1+D1', '=A1+E1', '=A1+F1'],
      ['=B1+A1', '=B1+B1', '=B1+C1', '=B1+D1', '=B1+E1', '=B1+F1'],
      ['=C1+A1', '=C1+B1', '=C1+C1', '=C1+D1', '=C1+E1', '=C1+F1'],
      ['=D1+A1', '=D1+B1', '=D1+C1', '=D1+D1', '=D1+E1', '=D1+F1'],
      ['=E1+A1', '=E1+B1', '=E1+C1', '=E1+D1', '=E1+E1', '=E1+F1'],
      ['=F1+A1', '=F1+B1', '=F1+C1', '=F1+D1', '=F1+E1', '=F1+F1'],
    ])
    expect(engine.getCellValueDetailedType(adr('A2'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('B2'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('C2'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D2'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('E2'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F2'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('B3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('C3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('D3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('E3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('F3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('A4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('B4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('C4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('E4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('F4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('A5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('B5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('C5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('D5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E5'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('F5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('A6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('B6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('C6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('D6'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('E6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F6'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('B7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('C7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('D7'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('F7'))).toBe(CellValueDetailedType.NUMBER_RAW)
  })

  it('subtraction should correctly infer types', () => {
    const engine = HyperFormula.buildFromArray([
      ['1','1%','1$','01/01/1900','12:00','01/01/1900 12:00'],
      ['=A1-A1', '=A1-B1', '=A1-C1', '=A1-D1', '=A1-E1', '=A1-F1'],
      ['=B1-A1', '=B1-B1', '=B1-C1', '=B1-D1', '=B1-E1', '=B1-F1'],
      ['=C1-A1', '=C1-B1', '=C1-C1', '=C1-D1', '=C1-E1', '=C1-F1'],
      ['=D1-A1', '=D1-B1', '=D1-C1', '=D1-D1', '=D1-E1', '=D1-F1'],
      ['=E1-A1', '=E1-B1', '=E1-C1', '=E1-D1', '=E1-E1', '=E1-F1'],
      ['=F1-A1', '=F1-B1', '=F1-C1', '=F1-D1', '=F1-E1', '=F1-F1'],
    ])
    expect(engine.getCellValueDetailedType(adr('A2'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('B2'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('C2'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D2'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('E2'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F2'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('B3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('C3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('D3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('E3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('F3'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
    expect(engine.getCellValueDetailedType(adr('A4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('B4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('C4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('E4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('F4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('A5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('B5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('C5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('D5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E5'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('F5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('A6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('B6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('C6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('D6'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('E6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F6'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('B7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('C7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('D7'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('F7'))).toBe(CellValueDetailedType.NUMBER_RAW)
  })

  it('multiplication should correctly infer types', () => {
    const engine = HyperFormula.buildFromArray([
      ['1','1%','1$','01/01/1900','12:00','01/01/1900 12:00'],
      ['=A1*A1', '=A1*B1', '=A1*C1', '=A1*D1', '=A1*E1', '=A1*F1'],
      ['=B1*A1', '=B1*B1', '=B1*C1', '=B1*D1', '=B1*E1', '=B1*F1'],
      ['=C1*A1', '=C1*B1', '=C1*C1', '=C1*D1', '=C1*E1', '=C1*F1'],
      ['=D1*A1', '=D1*B1', '=D1*C1', '=D1*D1', '=D1*E1', '=D1*F1'],
      ['=E1*A1', '=E1*B1', '=E1*C1', '=E1*D1', '=E1*E1', '=E1*F1'],
      ['=F1*A1', '=F1*B1', '=F1*C1', '=F1*D1', '=F1*E1', '=F1*F1'],
    ])
    expect(engine.getCellValueDetailedType(adr('A2'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('B2'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('C2'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D2'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('E2'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F2'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A3'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('B3'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('C3'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('D3'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('E3'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('F3'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('A4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('B4'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValueDetailedType(adr('C4'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('D4'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E4'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('F4'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('A5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('B5'))).toBe(CellValueDetailedType.NUMBER_DATE)
    expect(engine.getCellValueDetailedType(adr('C5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('D5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('F5'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('A6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('B6'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValueDetailedType(adr('C6'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('D6'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E6'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('F6'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('A7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('B7'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    expect(engine.getCellValueDetailedType(adr('C7'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('D7'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('E7'))).toBe(CellValueDetailedType.NUMBER_RAW)
    expect(engine.getCellValueDetailedType(adr('F7'))).toBe(CellValueDetailedType.NUMBER_RAW)
  })
})
