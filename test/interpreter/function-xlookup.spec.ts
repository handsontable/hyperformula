/**
 * Examples from
 * https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
 */

import { HyperFormula } from './../../src'
import {adr} from '../testUtils'


describe('Function XLOOKUP', () => {
    it('should find value in range (official example 1)', () => {
        const engine = HyperFormula.buildFromArray([
            ['China', 'CN', '+86'],
            ['India', 'IN', '+91'],
            ['United States', 'US', '+1'],
            ['Indonesia', 'ID', '+62'],
            ['France', 'FR', '+33'],
            ['=XLOOKUP("Indonesia", A1:A5, C1:C5)'],
        ], { useColumnIndex: false })

        expect(engine.getCellValue(adr('A6'))).toEqual('+62')
    })
})