import { HyperFormula } from '../../src';
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'
import { EmptyValue } from '../../src/Cell'
import { Alternation } from 'chevrotain';

// Data and test scenarios were part of the working draft for GNOME
// https://gitlab.gnome.org/GNOME/gnumeric/blob/master/samples/excel/operator.xls


const data =
    ['=A1=B1', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1', '=A1<>B1', '=A1+B1', '=A1-B1', '=A1*B1', '=A1/B1', '=A1^B1', '=A1&B1', '=+A1', '=-A1', '=A1%'];

function createEngine(data: any[][]) {
    const engine = HyperFormula.buildFromArray(data);

    return {
        getCellValue(cellAddress: string) {
            return engine.getCellValue(adr(cellAddress));
        }
    }
};

describe('Quality assurance of operators', () => {
    xit('BLANK should be supported by all comparison operators', () => { //pending on #127
        const engine = createEngine([
            [null, null, ...data]
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
        expect(engine.getCellValue('Q1')).toEqual(0); // PERCENTAGE
    });

    xit('TRUE and BLANK should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['true', null, ...data]
        ]);

        expect(engine.getCellValue('C1')).toEqual(false);  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(true); // GT    
        expect(engine.getCellValue('E1')).toEqual(false); // LT   
        expect(engine.getCellValue('F1')).toEqual(true); // GTE   
        expect(engine.getCellValue('G1')).toEqual(false); // LTE  
        expect(engine.getCellValue('H1')).toEqual(true); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(1); // ADD  
        expect(engine.getCellValue('J1')).toEqual(1); // SUB  
        expect(engine.getCellValue('K1')).toEqual(0); // MULT 
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV   
        expect(engine.getCellValue('M1')).toEqual(1); // EXP  
        expect(engine.getCellValue('N1')).toEqual('true'); // CONCAT    
        expect(engine.getCellValue('O1')).toEqual(0); // UNARY PLUS   
        expect(engine.getCellValue('P1')).toEqual(0); // UNARY MINUS  
        expect(engine.getCellValue('Q1')).toEqual(0); // PERCENTAGE  
    });

    xit('BLANK and TRUE should be supported by all comparison operators', () => {
        const engine = createEngine([
            [null, 'true', ...data]
        ]);

        expect(engine.getCellValue('D1')).toEqual(false); // GT    
        expect(engine.getCellValue('E1')).toEqual(true); // LT   
        expect(engine.getCellValue('F1')).toEqual(true); // GTE   
        expect(engine.getCellValue('G1')).toEqual(false); // LTE  
        expect(engine.getCellValue('J1')).toEqual(-1); // SUB  
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV   
        expect(engine.getCellValue('M1')).toEqual(1); // EXP  
    });

    xit('TRUE and TRUE should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['true', 'true', ...data]
        ]);

        expect(engine.getCellValue('C1')).toEqual(true);  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(false); // GT
        expect(engine.getCellValue('E1')).toEqual(false); // LT
        expect(engine.getCellValue('F1')).toEqual(true); // GTE
        expect(engine.getCellValue('G1')).toEqual(true); // LTE
        expect(engine.getCellValue('H1')).toEqual(false); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(2); // ADD
        expect(engine.getCellValue('J1')).toEqual(0); // SUB
        expect(engine.getCellValue('K1')).toEqual(1); // MULT
        expect(engine.getCellValue('L1')).toEqual(1); // DIV
        expect(engine.getCellValue('M1')).toEqual(1); // EXP
        expect(engine.getCellValue('N1')).toEqual('truetrue'); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(true); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(-1); // UNARY MINUS
        expect(engine.getCellValue('Q1')).toEqual(0.01); // PERCENTAGE
    });

    xit('TRUE and FALSE should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['true', 'false', ...data]
        ]);

        expect(engine.getCellValue('C1')).toEqual(false);  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(true); // GT
        expect(engine.getCellValue('E1')).toEqual(false); // LT
        expect(engine.getCellValue('F1')).toEqual(true); // GTE
        expect(engine.getCellValue('G1')).toEqual(false); // LTE
        expect(engine.getCellValue('H1')).toEqual(true); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(1); // ADD
        expect(engine.getCellValue('J1')).toEqual(1); // SUB
        expect(engine.getCellValue('K1')).toEqual(0); // MULT
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO));
        expect(engine.getCellValue('M1')).toEqual(1); // EXP
        expect(engine.getCellValue('N1')).toEqual('truefalse'); // CONCAT
    });

    xit('FALSE and FALSE should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['false', 'false', ...data]
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
        expect(engine.getCellValue('N1')).toEqual('falsefalse'); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(false); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(0); // UNARY MINUS
        expect(engine.getCellValue('Q1')).toEqual(0); // PERCENTAGE
    });

    xit('FALSE and TRUE should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['false', 'true', ...data]
        ]);

        expect(engine.getCellValue('D1')).toEqual(false); // GT    
        expect(engine.getCellValue('E1')).toEqual(true); // LT   
        expect(engine.getCellValue('F1')).toEqual(false); // GTE   
        expect(engine.getCellValue('G1')).toEqual(true); // LTE  
        expect(engine.getCellValue('J1')).toEqual(-1); // SUB  
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV   
        expect(engine.getCellValue('M1')).toEqual(1); // EXP  

    });

    xit('#DIV/0! and #DIV/0! should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['#DIV/0!', '#DIV/0!', ...data]
        ]);

        expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO));  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GT
        expect(engine.getCellValue('E1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LT
        expect(engine.getCellValue('F1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GTE
        expect(engine.getCellValue('G1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LTE 
        expect(engine.getCellValue('H1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //ADD
        expect(engine.getCellValue('J1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //SUB
        expect(engine.getCellValue('K1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //MULT
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV
        expect(engine.getCellValue('M1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // EXP
        expect(engine.getCellValue('N1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY MINUS
        expect(engine.getCellValue('Q1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // PERCENTAGE

    });

    xit('#DIV/0! and #DIV/0! should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['#DIV/0!', '#DIV/0!', ...data],

        ]);

        expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO));  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GT
        expect(engine.getCellValue('E1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LT
        expect(engine.getCellValue('F1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GTE
        expect(engine.getCellValue('G1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LTE 
        expect(engine.getCellValue('H1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //ADD
        expect(engine.getCellValue('J1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //SUB
        expect(engine.getCellValue('K1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //MULT
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV
        expect(engine.getCellValue('M1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // EXP
        expect(engine.getCellValue('N1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY MINUS
        expect(engine.getCellValue('Q1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // PERCENTAGE

    });

    xit('error #DIV/0! in every combination should be supported by all comparison operators', () => {
        const engine = createEngine([
            ['#DIV/0!', '#DIV/0!', ...data]q

        ]);

        expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO));  // EQUAL
        expect(engine.getCellValue('D1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GT
        expect(engine.getCellValue('E1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LT
        expect(engine.getCellValue('F1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // GTE
        expect(engine.getCellValue('G1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // LTE 
        expect(engine.getCellValue('H1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // NOT EQUAL
        expect(engine.getCellValue('I1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //ADD
        expect(engine.getCellValue('J1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //SUB
        expect(engine.getCellValue('K1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); //MULT
        expect(engine.getCellValue('L1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // DIV
        expect(engine.getCellValue('M1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // EXP
        expect(engine.getCellValue('N1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // CONCAT
        expect(engine.getCellValue('O1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY PLUS
        expect(engine.getCellValue('P1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // UNARY MINUS
        expect(engine.getCellValue('R1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO)); // PERCENTAGE
    });


})


