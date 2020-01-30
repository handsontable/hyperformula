import { HyperFormula } from '../../src';
import { CellError, ErrorType } from '../../src/Cell'
import '../testConfig'
import { adr, dateNumberToString } from '../testUtils'

// Data and test scenarios were part of the working draft for OpenFormula standard
// https://www.oasis-open.org/committees/download.php/16826/openformula-spec-20060221.html#DATE

function createEngine(data: any[][]) {
  let engine = HyperFormula.buildFromArray(data);

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress));
    }
  }
}

describe('Acceptance tests DATE function', () => {
  it('should suport simple date', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2005,1,31)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('31/01/2005');
  });

  it('should support nonleap year 2001 ', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2001,02,29)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('28/02/2001');
  });


  it('should suport leap year 2016', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2016,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('29/02/2016');

  });

  it('should suport leap year 2020', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2020,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('29/02/2020');
  });

  it('should suport leap year 2024', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2024,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A3')))).toEqual('29/02/2024');

  });

  it('should suport leap year 2028', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2028,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A4')))).toEqual('29/02/2028');
  });

  it('should suport leap year 2032', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2032,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A4')))).toEqual('29/02/2032');
  });

  it('should suport leap year 2040', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2040,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('29/02/2040');
  });

});





