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
      ['=SUM(1,2)']
    ]);

    expect(engine.getCellValue('A1')).toBe(3);
  });
});
