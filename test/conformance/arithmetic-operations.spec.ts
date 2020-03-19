import { HyperFormula, DetailedCellError, CellError, EmptyValue } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { Config } from '../../src/Config'
import { ErrorType } from '../../src/Cell'


const data =
    ['=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%']

function createEngine(data: any[][]) {
  const engine = HyperFormula.buildFromArray(data)
  
  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress))
    }
  }
}

describe('Quality assurance of negative numbers', () => { //pending on PR #203
  it('-1 and -1', () => {
    const engine = HyperFormula.buildFromArray([
      [-1, -1, ...data],
    ])
   
    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(-2) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(0) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(1) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(1) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(-1) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('-1-1') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual(-1) // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(1) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(-0.01) // PERCENTAGE
  })

  xit('-1 and -1E+19', () => {
    const engine = HyperFormula.buildFromArray([
      [-1, -1E+19, ...data],
    ], new Config({ smartRounding: false}))
   
    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(-1E+19) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(1E+19) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(1E+19) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(1E-19) //DIV return 0
    //expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')) //EXP  //1
    expect(engine.getCellValue(adr('N1'))).toEqual('-1-10000000000000000000') // CONCAT
  })

})