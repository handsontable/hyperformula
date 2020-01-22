import { HyperFormula } from '../../src';
import { CellError, ErrorType } from '../../src/Cell'
import '../testConfig'
import { adr } from '../testUtils';

const data = [
  [null, null, null],
  [null, '="7', null],
  [null, '=2', '4'],
  [null, '=3', '5'],
  [null, '=1=1', '7'],
  [null, '="Hello"', '2005-01-31'],
  [null, null, '2006-01-31'],
  [null, '=1/0', '02:00:00'],
  [null, '=0', '23:00:00'],
  [null, '3', '5'],
  [null, '4', '6'],
  [null, '2005-01-31T01:00:00', '8'],
  [null, '=999999999999999000000', '=999999999999999'],
  [null, '999999999999999000000', '999999999999999']
];

function createEngine(data: any[][]) {
  let engine = HyperFormula.buildFromArray(data);

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress));
    }
  }
}

describe('Quality Assurance tests', () => {
  it('should support SUM function', () => {
    const engine = createEngine([
      ['=SUM(1,2)'],
      ['=SUM(-1,2)'],
      ['=SUM(-1,-2)'],
      ['=SUM(0,-2)'],
      ['=SUM(1.50000000000000,2)'],
      ['=SUM(-1.50000000000000000000,2.00000000000000000000)'],
      ['=SUM(-1.500000,-2.00000000000000000000)'],
      ['=SUM(1,2,3)'],
      //['=SUM(1;2;3)'],
      //['=SUM(TRUE();2;3)']

    ]);

    expect(engine.getCellValue('A1')).toBe(3);
    expect(engine.getCellValue('A2')).toBe(1);
    expect(engine.getCellValue('A3')).toBe(-3);
    expect(engine.getCellValue('A4')).toBe(-2);
    expect(engine.getCellValue('A5')).toBe(3.5);
    expect(engine.getCellValue('A6')).toBe(0.5);
    expect(engine.getCellValue('A7')).toBe(-3.5);
    expect(engine.getCellValue('A8')).toBe(6);
    //expect(engine.getCellValue('A9')).toBe(6);
    //expect(engine.getCellValue('A10')).toBe(6);

  });

  it('should support SUM function with range', () => {
    const engine = createEngine([
      ['=SUM(B4:B5)'],
      ...data
    ]);

    expect(engine.getCellValue('A1')).toBe(5);
  });

  it('should support SUM function with range', () => {
    const engine = createEngine([
      ['=SUM(B4:B5)'],
      ...data
    ]);

    expect(engine.getCellValue('A1')).toBe(5);
  });

  it('incorect SUM should propagates `#NAME` errors', () => {
    const engine = createEngine([
      ['=SUM(B4B5)'],
      ['=SUM'],
      ['=SUM']
    ]);

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME));
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NAME));
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.NAME))
  });

  
});





