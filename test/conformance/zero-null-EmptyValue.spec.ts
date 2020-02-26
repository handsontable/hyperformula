import { HyperFormula, DetailedCellError } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { EmptyValue } from '../../src/Cell'

// Data and test scenarios were part of the working draft for GNOME
// https://gxitlab.gnome.org/GNOME/gnumeric/blob/master/samples/excel/operator.xls

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

describe('Quality assurance of comparision of 0, null and EmptyValue', () => {
  xit('Zero with empty string given directly should be supported by all comparison operators', () => {
    const engine = createEngine([
      [0, '', ...data]
    ])

    //expect(engine.getCellValue('C1')).toEqual(true)  // EQUAL false
    expect(engine.getCellValue('H1')).toEqual(false) // NOT EQUAL true
  })
    
  xit('Zero with null given directly should be supported by all comparison operators', () => {
    const engine = createEngine([
      [0, null, ...data]
    ])

    //expect(engine.getCellValue('C1')).toEqual(true) // EQUAL
    //expect(engine.getCellValue('D1')).toEqual(false) // GT    
    expect(engine.getCellValue('E1')).toEqual(false) // LT   true
    expect(engine.getCellValue('F1')).toEqual(true) // GTE   false
    //expect(engine.getCellValue('G1')).toEqual(true) // LTE  false
    //expect(engine.getCellValue('H1')).toEqual(false) // NOT EQUAL true
    expect(engine.getCellValue('I1')).toEqual(0) // ADD 
    expect(engine.getCellValue('J1')).toEqual(0) // SUB   
    expect(engine.getCellValue('K1')).toEqual(0) // MULT  
    expect(engine.getCellValue('L1')).toEqual(new DetailedCellError(new CellError(ErrorType.DIV_BY_ZERO), '#DIV/0!')) // DIV  
    expect(engine.getCellValue('M1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')) // EXP  
    expect(engine.getCellValue('N1')).toEqual(0) // CONCAT    
    expect(engine.getCellValue('P1')).toEqual(0) // UNARY PLUS   
    expect(engine.getCellValue('P1')).toEqual(0) // UNARY MINUS  
    expect(engine.getCellValue('Q1')).toEqual(0) // PERCENTAGE  
  })

  xit('Zero with EmptyValue given by reference should be supported by all comparison operators', () => {
    const engine = createEngine([
      [0, '=A2', ...data],
      [EmptyValue]
    ])
    expect(engine.getCellValue('A1')).toEqual(0) 
    expect(engine.getCellValue('B1')).toEqual(EmptyValue) 
    expect(engine.getCellValue('A2')).toEqual(EmptyValue) 
    
    //expect(engine.getCellValue('C1')).toEqual(true) // EQUAL
    //expect(engine.getCellValue('D1')).toEqual(false) // GT    
    //expect(engine.getCellValue('E1')).toEqual(false) // LT   true
    //expect(engine.getCellValue('F1')).toEqual(true) // GTE   false
    //expect(engine.getCellValue('G1')).toEqual(true) // LTE  
    //expect(engine.getCellValue('H1')).toEqual(false) // NOT EQUAL true
    expect(engine.getCellValue('I1')).toEqual(0) // ADD 
    expect(engine.getCellValue('J1')).toEqual(0) // SUB   
    expect(engine.getCellValue('K1')).toEqual(0) // MULT  
    expect(engine.getCellValue('L1')).toEqual(new DetailedCellError(new CellError(ErrorType.DIV_BY_ZERO), '#DIV/0!')) // DIV  
    expect(engine.getCellValue('M1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')) // EXP  
    expect(engine.getCellValue('N1')).toEqual(0) // CONCAT    
    expect(engine.getCellValue('P1')).toEqual(0) // UNARY PLUS   
    expect(engine.getCellValue('P1')).toEqual(0) // UNARY MINUS  
    expect(engine.getCellValue('Q1')).toEqual(0) // PERCENTAGE  
  })
    
  xit('2Zero with EmtyValue given by reference should be supported by all comparison operators', () => {
    const engine = createEngine([
      [0],
      [EmptyValue],
      ['=']
    ])
    
    //expect(engine.getCellValue('C1')).toEqual(true)  // EQUAL
    expect(engine.getCellValue('D1')).toEqual(false) // GT    
    //expect(engine.getCellValue('E1')).toEqual(true) // LT   false
    expect(engine.getCellValue('F1')).toEqual(true) // GTE   
    expect(engine.getCellValue('G1')).toEqual(true) // LTE  
    expect(engine.getCellValue('H1')).toEqual(false) // NOT EQUAL 
    expect(engine.getCellValue('I1')).toEqual(0) // ADD 
    expect(engine.getCellValue('J1')).toEqual(0) // SUB   
    expect(engine.getCellValue('K1')).toEqual(0) // MULT  
    expect(engine.getCellValue('L1')).toEqual(new DetailedCellError(new CellError(ErrorType.DIV_BY_ZERO), '#DIV/0!')) // DIV  0
    expect(engine.getCellValue('M1')).toEqual(0) // EXP  
    expect(engine.getCellValue('N1')).toEqual('00') // CONCAT
  })

  xit('Zero with Zero given directly should be supported by all comparison operators', () => {
    const engine = createEngine([
      [0, 0, ...data]
    ])
    
    expect(engine.getCellValue('C1')).toEqual(true)  // EQUAL
    expect(engine.getCellValue('D1')).toEqual(false) // GT    
    //expect(engine.getCellValue('E1')).toEqual(true) // LT   false
    expect(engine.getCellValue('F1')).toEqual(true) // GTE   
    expect(engine.getCellValue('G1')).toEqual(true) // LTE  
    expect(engine.getCellValue('H1')).toEqual(false) // NOT EQUAL 
    expect(engine.getCellValue('I1')).toEqual(0) // ADD 
    expect(engine.getCellValue('J1')).toEqual(0) // SUB   
    expect(engine.getCellValue('K1')).toEqual(0) // MULT  
    expect(engine.getCellValue('L1')).toEqual(new DetailedCellError(new CellError(ErrorType.DIV_BY_ZERO), '#DIV/0!')) // DIV  0
    expect(engine.getCellValue('M1')).toEqual(1) // EXP  //like GS, but is 0 in E
    expect(engine.getCellValue('N1')).toEqual('00') // CONCAT
  })

})