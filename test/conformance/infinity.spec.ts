import { HyperFormula, DetailedCellError } from '../../src';
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType, CellType } from '../../src/Cell'
import { EmptyValue } from '../../src/Cell'
import { LogarithmPlugin } from '../../src/interpreter/plugin/LogarithmPlugin';

function createEngine(data: any[][]) {
    const engine = HyperFormula.buildFromArray(data);

    return {
        getCellValue(cellAddress: string) {
            return engine.getCellValue(adr(cellAddress));
        }
    }
};

describe('Quality assurance of operators', () => {
    it('LOG(0) should thrown #NUM! error', () => {
        const engine = createEngine([
            [0],
            ['=LOG(A1)'],
        ]);

        expect(engine.getCellValue('A2')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!'));

    });

    xit('EXP(1000000000) should thrown #NUM! error', () => { //pending for #196
        const engine = createEngine([
            [1000000000],
            ['=EXP(A1)']
        ]);

        expect(engine.getCellValue('A2')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')); //return Infinity
    });

    it('SQRT(-2)should thrown #NUM! error', () => {
        const engine = createEngine([
            ['=SQRT(-2)']
        ]);

        expect(engine.getCellValue('A1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!'));
    });

    xit('1000^500 should thrown #NUM! error', () => { //pending for #196
        const engine = createEngine([
            ['=1000^500']
        ]);

        expect(engine.getCellValue('A1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')); //return Infinity
    });

    it('smallest number -1*10 ^308 should return -1.0000000000000006e+308', () => {
        const engine = createEngine([
            ['=-1*10 ^308']
        ]);

        expect(engine.getCellValue('A1')).toEqual(-1.0000000000000006e+308);
    });

    xit('too small -1*10^309 should return #NUM!', () => { //pending for #196
        const engine = createEngine([
            ['=-1*10 ^309']
        ]);

        expect(engine.getCellValue('A1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')); //return -Infinity
    });

    xit('too big number should return #NUM!', () => { //pending for #196
        const engine = createEngine([
            [`=9.99*10 ^308`]
        ]);

        expect(engine.getCellValue('A1')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!')); //return Infinity
    });



})