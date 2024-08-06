/**
 * Examples from
 * https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
 */

import { HyperFormula } from './../../src'
import { adr } from '../testUtils'
import { AbsoluteCellRange } from '../../src/AbsoluteCellRange'


describe('Function XLOOKUP', () => {
  it('should find value in simple column range (official example 1)', () => {
    const engine = HyperFormula.buildFromArray([
      ['China', 'CN'],
      ['India', 'IN'],
      ['United States', 'US'],
      ['Indonesia', 'ID'],
      ['France', 'FR'],
      ['=XLOOKUP("Indonesia", A1:A5, B1:B5)'],
    ], { useColumnIndex: false })

    expect(engine.getCellValue(adr('A6'))).toEqual('ID')
  })

  it('should find row range in table (official example 2)', () => {
    const engine = HyperFormula.buildFromArray([
      ['8389', 'Dianne Pugh', 'Finance'],
      ['4390', 'Ned Lanning', 'Marketing'],
      ['8604', 'Margo Hendrix', 'Sales'],
      ['8389', 'Dianne Pugh', 'Finance'],
      ['4937', 'Earlene McCarty', 'Accounting'],
      ['=XLOOKUP(A1, A2:A5, B2:C5)'],
    ], { useColumnIndex: false })

    expect(engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A6'), 2, 1))).toEqual([['Dianne Pugh', 'Finance']])
  })

  it('should find column range in table (official example 2, transposed)', () => {
    const engine = HyperFormula.buildFromArray([
      ['8389', '4390', '8604', '8389', '4937'],
      ['Dianne Pugh', 'Ned Lanning', 'Margo Hendrix', 'Dianne Pugh', 'Earlene McCarty'],
      ['Finance', 'Marketing', 'Sales', 'Finance', 'Accounting'],
      ['=XLOOKUP(A1, B1:E1, B2:E3)'],
      []
    ], { useColumnIndex: false })

    expect(engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A4'), 1, 2))).toEqual([['Dianne Pugh'], ['Finance']])
  })

  it('should find use if_not_found argument if not found (official example 3)', () => {
    const engine = HyperFormula.buildFromArray([
      ['1234', 'Dianne Pugh', 'Finance'],
      ['4390', 'Ned Lanning', 'Marketing'],
      ['8604', 'Margo Hendrix', 'Sales'],
      ['8389', 'Dianne Pugh', 'Finance'],
      ['4937', 'Earlene McCarty', 'Accounting'],
      ['=XLOOKUP(A1, A2:A5, B2:C5, "ID not found")'],
    ], { useColumnIndex: false })

    expect(engine.getCellValue(adr('A6'))).toEqual('ID not found')
  })

  it('nested xlookup function to perform both a vertical and horizontal match (official example 5)', () => {
    const engine = HyperFormula.buildFromArray([
      ['Quarter', 'Gross profit', 'Net profit', 'Profit %'],
      ['Qtr1', '=XLOOKUP(B1, $A4:$A12, XLOOKUP($A2, $B3:$F3, $B4:$F12))', '19342', '29.3'],
      ['Income statement', 'Qtr1', 'Qtr2', 'Qtr3', 'Qtr4', 'Total'],
      ['Total sales', '50000', '78200', '89500', '91200', '308950'],
      ['Cost of sales', '25000', '42050', '59450', '60450', '186950'],
      ['Gross profit', '25000', '36150', '30050', '30800', '122000'],
      ['Depreciation', '899', '791', '202', '412', '2304'],
      ['Interest', '513', '853', '150', '956', '2472'],
      ['Earnings before tax', '23588', '34506', '29698', '29432', '117224'],
      ['Tax', '4246', '6211', '5346', '5298', '21100'],
      ['Net profit', '19342', '28295', '24352', '24134', '96124'],
      ['Profit %', '29.3', '27.8', '23.4', '27.6', '26.9'],
    ], { useColumnIndex: false })

    expect(engine.getCellValue(adr('B2'))).toEqual(25000)
  })

  // TODO - Uncomment this function when functions are allowed to return ranges in Hyperformula
  // it('two nested xlookup + sum (official example 6)', () => {
  //   const engine = HyperFormula.buildFromArray([
  //     ['Start', 'End', 'Total'],
  //     ['Grape', 'Banana', '=SUM(XLOOKUP(A2, A4:A8, D4:D8):XLOOKUP(B2, A4:A8, D4:D8))'],
  //     ['Product', 'Qty', 'Price', 'Total'],
  //     ['Apple', '23', '0.52', '11.90'],
  //     ['Grape', '98', '0.77', '75.28'],
  //     ['Pear', '75', '0.24', '18.16'],
  //     ['Banana', '95', '0.18', '17.25'],
  //     ['Cherry', '42', '0.16', '6.80']
  //   ],
  //     { useColumnIndex: false }
  //   )

  //   expect(engine.getCellValue(adr('C2'))).toEqual(110.70)
  // })
})