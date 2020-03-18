import { HyperFormula, DetailedCellError } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { plPL } from '../../src/i18n'
import { Config } from '../../src/Config'

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

  it('"jaźŃ", "ąęćńóśżź" should be supported by all operators', () => { //pending on #225
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

  it('"Żółcią", "ąęćńóśżź" should be supported by all operators with case sensetive and PL language', () => {
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

  it('"AAa", "aaa" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['AAa', 'aaa', ...data],
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
    expect(engine.getCellValue(adr('N1'))).toEqual('AAaaaa') // CONCAT
  })

  it('"aaa", "AAa" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['aaa', 'AAa', ...data],
    ], new Config({ caseSensitive : true }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP 
    expect(engine.getCellValue(adr('N1'))).toEqual('aaaAAa') // CONCAT
  })
  
  it('"A", "a" should be supported by all operators with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['A', 'a', ...data],
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

  it('Turkish name İnanç compared with "aaaaa" with case sensetive', () => { 
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

  it('Turkish name İnanç compared with "aaaaa" without case sensetive', () => {
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

  it('Turkish name İnanç compared with "aaaaa" with case sensetive & PL', () => {
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

  it('Chinese characters compared among themselves with case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['人名', '人名', ...data],
    ], new Config({ caseSensitive : true, language: plPL }))

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
    expect(engine.getCellValue(adr('N1'))).toEqual('人名人名') // CONCAT 
    expect(engine.getCellValue(adr('O1'))).toEqual('人名') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // PERCENTAGE
  })

  it('Chinese characters compared among themselves ', () => { //based on E
    const engine = HyperFormula.buildFromArray([
      ['人名', '發', ...data],
    ], new Config({ caseSensitive : false, language: plPL }))

    expect(engine.getCellValue(adr('C1'))).toEqual(false)  // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('人名發') // CONCAT 
  })

  it('Traditional Chinese character compared with a simplified one', () => { ////based on E
    const engine = HyperFormula.buildFromArray([
      ['發', '发', ...data],
    ], new Config({ caseSensitive : false, language: plPL }))

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
    expect(engine.getCellValue(adr('N1'))).toEqual('發发') // CONCAT 
  })

  it('"country" in Chinese traditional vs. simplified', () => { //https://r12a.github.io/scripts/chinese/
    const engine = HyperFormula.buildFromArray([
      ['国', '國', ...data],
    ], new Config({ caseSensitive : false, language: plPL }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#ARG!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('国國') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('国') // UNARY PLUS
  })
    
  it('"the world" in Chinese same string ', () => { //https://r12a.github.io/scripts/chinese/
    const engine = HyperFormula.buildFromArray([
      ['界', '界', ...data],
    ], new Config({ caseSensitive : false, language: plPL }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('界界') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('界') // UNARY PLUS
  })
    
  it('"名人" in Chinese compared to `Aa` with case sensetive ', () => { //https://r12a.github.io/scripts/chinese/
    const engine = HyperFormula.buildFromArray([
      ['名人', 'Aa', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('名人Aa') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('名人') // UNARY PLUS
  })
    
  it('"名人" in Chinese compared to `Aa` without case sensetive ', () => { //pending on #225
    const engine = HyperFormula.buildFromArray([
      ['名人', 'Aa', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('名人Aa') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('名人') // UNARY PLUS
  })
})

xdescribe('Escaped strings', () => {
  it('"Hello \"World\"." vs. "Hello \"World\"." should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('Hello \"World\".Hello \"World\".') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('Hello \"World\".') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('"Hello \"World\"." vs. "Hello \"World\"." should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('Hello \"World\".Hello \"World\".') // CONCAT
  })

  it('"Hello \"World\"." vs. "\'Hello \\"World\\".\'" should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \"World\".Hello \\\"World\\\".'") // CONCAT
  })

  it('"Hello \"World\"." vs. "\'Hello \\"World\\".\'" should handle comparison operationswith case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \"World\".Hello \\\"World\\\".'") // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('Hello \"World\".') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })
  
  it('"Hello \"World\"." vs. 1 should handle comparison operationswithout case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \"World\".Hello \\\"World\\\".'") // CONCAT
  })

  it('"Hello \"World\"." vs. 2 should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['Hello \"World\".', "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \"World\".Hello \\\"World\\\".'") // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('Hello \"World\".') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('\'Hello \\"World\\".\' vs. "Hello \"World\"." should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \"World\".") // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual("Hello \\\"World\\\".'") // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('"\'Hello \\"World\\".\'" vs. "Hello \"World\"." should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \"World\".") // CONCAT
  })

  it('"\'Hello \\"World\\".\'" vs. "\'Hello \\"World\\".\'" should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT

  })

  it('"\'Hello \\"World\\".\'" vs. \'Hello \\"World\\".\' should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it('"\'Hello \\"World\\".\'" vs. 3  should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    //expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it('"\'Hello \\"World\\".\'" vs. "Hello \\\"World\\\". should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\'Hello \\"World\\".\'', "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    //expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    //expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    //expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it('1 vs. 2 should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \"World\".") // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual("Hello \\\"World\\\".'") // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('Hello \\\"World\\\". vs. 2 should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", 'Hello \"World\".', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \"World\".") // CONCAT
  })

  it('1 vs. \'Hello \\World\\".\' should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    //expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE
    //expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it('should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", '\'Hello \\"World\\".\'', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    //expect(engine.getCellValue(adr('D1'))).toEqual(true) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(false) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(true) // GTE
    //expect(engine.getCellValue(adr('G1'))).toEqual(false) // LTE 
    //expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it('"Hello \\\"World\\\"." vs. 2 should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })

  it(' "Hello \\\"World\\\"." vs. "Hello \\\"World\\\". should handle comparison operations with case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ["'Hello \\\"World\\\".'", "'Hello \\\"World\\\".'", ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual("Hello \\\"World\\\".'Hello \\\"World\\\".'") // CONCAT
  })
})

describe('Unusual strings', () => {
  it('Emoji and string should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['🧪', 'test', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('🧪test') // CONCAT
    expect(engine.getCellValue(adr('O1'))).toEqual('🧪') // UNARY PLUS
    expect(engine.getCellValue(adr('P1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // UNARY MINUS 
    expect(engine.getCellValue(adr('Q1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // PERCENTAGE
  })

  it('Emoji and string should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['🧪', 'Test', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
    expect(engine.getCellValue(adr('D1'))).toEqual(false) // GT
    expect(engine.getCellValue(adr('E1'))).toEqual(true) // LT
    expect(engine.getCellValue(adr('F1'))).toEqual(false) // GTE
    expect(engine.getCellValue(adr('G1'))).toEqual(true) // LTE
    expect(engine.getCellValue(adr('H1'))).toEqual(true) // NOT EQUAL
    expect(engine.getCellValue(adr('I1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // ADD
    expect(engine.getCellValue(adr('J1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // SUB
    expect(engine.getCellValue(adr('K1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) // MULT
    expect(engine.getCellValue(adr('L1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //DIV
    expect(engine.getCellValue(adr('M1'))).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!')) //EXP
    expect(engine.getCellValue(adr('N1'))).toEqual('🧪Test') // CONCAT
  })

  it('Emoji and emoji should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['🧪', '🧪', ...data],
    ], new Config({ caseSensitive : false }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('🧪🧪') // CONCAT
  })

  it('Emoji and emoji should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['🧪', '🧪', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(true) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('🧪🧪') // CONCAT
  })

  it('Unicode "SZAA" and emoji should handle comparison operations without case sensitive', () => { 
    const engine = HyperFormula.buildFromArray([
      ['\u1223', '🧪', ...data],
    ], new Config({ caseSensitive : true }))
    
    expect(engine.getCellValue(adr('C1'))).toEqual(false) // EQUAL
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
    expect(engine.getCellValue(adr('N1'))).toEqual('\u1223🧪') // CONCAT
  })

})



