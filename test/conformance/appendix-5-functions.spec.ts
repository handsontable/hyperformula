import { HyperFormula } from '../../src';
import { adr } from '../testUtils';

function createEngine(data: any[][]) {
  let engine = HyperFormula.buildFromArray(data);

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress));
    }
  }
}

describe('Quality Assurance tests', () => {
  it('support SUM function', () => {
    const engine = createEngine([
      ['=SUM(1,2)'],
      ['=SUM(-1,2)'],
      ['=SUM(-1,-2)'],
      ['=SUM(0,-2)'],
      ['=SUM(1.50000000000000,2)'],
      ['=SUM(-1.50000000000000000000,2.00000000000000000000)'],
      ['=SUM(-1.500000,-2.00000000000000000000)'],   
    ]);

    expect(engine.getCellValue('A1')).toBe(3);
    expect(engine.getCellValue('A2')).toBe(1);
    expect(engine.getCellValue('A3')).toBe(-3);
    expect(engine.getCellValue('A4')).toBe(-2);
    expect(engine.getCellValue('A5')).toBe(3.5);
    expect(engine.getCellValue('A6')).toBe(0.5);
    expect(engine.getCellValue('A7')).toBe(-3.5);
      });
});

