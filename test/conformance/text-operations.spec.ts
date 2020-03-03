import { Config, HyperFormula, DetailedCellError } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { plPL } from '../../src/i18n'

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

describe('Text arithmetic and logical comparision', () => { //pending on PR #203
  it('"Aaa", "Aaa" should be supported by all operators', () => {
    const engine = HyperFormula.buildFromArray([
      ['Aaa', 'Aaa', ...data],
    ], new Config({ caseSensitive : true}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('AaaAaa') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('Aaa') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('"aaa", "aaa" should be supported by all operators', () => {
    const engine = HyperFormula.buildFromArray([
      ['aaa', 'aaa', ...data],
    ], new Config({ caseSensitive : true}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('aaaaaa') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('aaa') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('"AAa", "AAa" should be supported by all operators', () => {
    const engine = HyperFormula.buildFromArray([
      ['AAa', 'AAa', ...data],
    ], new Config({ caseSensitive : true}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('AAaAAa') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('AAa') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('"ąęćńóśżź", "ąęćńóśżź" should be supported by all operators', () => {
    const engine = HyperFormula.buildFromArray([
      ['ąęćńóśżź', 'ąęćńóśżź', ...data],
    ], new Config({ caseSensitive : true, language: plPL}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('ąęćńóśżźąęćńóśżź') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('ąęćńóśżź') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // PERCENTAGE
  })

  xit('"jaźŃ", "ąęćńóśżź" should be supported by all operators', () => { //pending on #225
    const engine = HyperFormula.buildFromArray([
      ['jaźŃ', 'ąęćńóśżź', ...data],
    ], new Config({ caseSensitive : true, language: plPL}))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    //expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTEgs
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('jaźŃąęćńóśżź') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('jaźŃ') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // PERCENTAGE
  })

  it('"Żółcią", "ąęćńóśżź" should be supported by all operatorswith case', () => {
    const engine = HyperFormula.buildFromArray([
      ['Żółcią', 'ąęćńóśżź', ...data],
    ], new Config({ caseSensitive : true, language: plPL}))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('Żółciąąęćńóśżź') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('Żółcią') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // PERCENTAGE
  })

  it('"AAa", "aaa" should be supported by all operators without case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['AAa', 'aaa', ...data],
    ], new Config({ caseSensitive : false}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('AAaaaa') // CONCAT
  })

  it('"AAa", "aaa" should be supported by all operators without case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['aaa', 'AAa', ...data],
    ], new Config({ caseSensitive : false}))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('aaaAAa') // CONCAT
  })

  xit('"AAa", "aaa" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['AAa', 'aaa', ...data],
    ], new Config({ caseSensitive : true }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    //expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('AAaaaa') // CONCAT
  })

  it('"AAa", "aaa" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['aaa', 'AAa', ...data],
    ], new Config({ caseSensitive : true }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('aaaAAa') // CONCAT
  })
  
  xit('"A", "a" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['A', 'a', ...data],
    ], new Config({ caseSensitive : true }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    //expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('Aa') // CONCAT
  })

  it('"A", "a" should be supported by all operators without case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['A', 'a', ...data],
    ], new Config({ caseSensitive : false }))

    expect(engine.getCellValue(adr('C1'))).toEqual(true)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(false) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
  })

  it('Turkish name İnanç compared with "aaaaa" with caseSensetive', () => {
    const engine = HyperFormula.buildFromArray([
      ['İnanç', 'aaaaa', ...data],
    ], new Config({ caseSensitive : true }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('İnançaaaaa') // CONCAT 
  })

  it('Turkish name İnanç compared with "aaaaa" without caseSensetive', () => {
    const engine = HyperFormula.buildFromArray([
      ['İnanç', 'aaaaa', ...data],
    ], new Config({ caseSensitive : false }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('İnançaaaaa') // CONCAT 
  })

  it('Turkish name İnanç compared with "aaaaa" with caseSensetive & PL', () => {
    const engine = HyperFormula.buildFromArray([
      ['İnanç', 'aaaaa', ...data],
    ], new Config({ caseSensitive : true, language: plPL }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('İnançaaaaa') // CONCAT 
  })
  

  
})

