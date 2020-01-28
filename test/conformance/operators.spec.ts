import { HyperFormula } from '../../src';
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { EmptyValue } from '../../src/Cell'

// Data and test scenarios were part of the working draft for GNOME
// https://gitlab.gnome.org/GNOME/gnumeric/blob/master/samples/excel/operator.xls


function createEngine(data: any[][]) {
    let engine = HyperFormula.buildFromArray(data);

    return {
        getCellValue(cellAddress: string) {
            return engine.getCellValue(adr(cellAddress));
        }
    }
};

describe('Quality assurance of operators', () => {
    xit('BLANK should be supported by all comparison operators', () => { //pending on #127
        const engine = createEngine([
            [null, null, '=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%'],
        ]);

        expect(engine.getCellValue('C1')).toEqual(true);  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(false); // GT
        expect(engine.getCellValue('E1')).toEqual(false); // LT
        expect(engine.getCellValue('F1')).toEqual(true); // GTE
        expect(engine.getCellValue('G1')).toEqual(true); // LTE
        expect(engine.getCellValue('H1')).toEqual(false); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(0); // ADD
        expect(engine.getCellValue('J1')).toEqual(0); // SUB
        expect(engine.getCellValue('K1')).toEqual(0); // MULT
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV
        expect(engine.getCellValue('M1')).toEqual(new CellError(ErrorType.NUM)); // EXP
        expect(engine.getCellValue('N1')).toEqual(EmptyValue); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(0); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(0); // UNARY MINUS
        expect(engine.getCellValue('R1')).toEqual(0); // PERCENTAGE
    })



})


