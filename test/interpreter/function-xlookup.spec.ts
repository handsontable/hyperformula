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

  it('should find range in table (official example 2)', () => {
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
})