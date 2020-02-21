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

    xit('EXP(1000000000) should thrown #NUM! error', () => {
        const engine = createEngine([
            [1000000000],
            ['=EXP(A1)']
        ]);

        expect(engine.getCellValue('A2')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!'));
    });
})