import { HyperFormula } from '../../src';
import { CellError, ErrorType } from '../../src/Cell'
import '../testConfig'
import { adr, dateNumberToString } from '../testUtils'

// Data and test scenarios were part of the working draft for OpenFormula standard
// https://www.oasis-open.org/committees/download.php/16826/openformula-spec-20060221.html#DATE

// function createEngine(data: any[][]) {
//   let engine = HyperFormula.buildFromArray(data);

//   return {
//     getCellValue(cellAddress: string) {
//       return engine.getCellValue(adr(cellAddress));
//     }
//   }
// }

describe('Acceptance tests DATE function', () => {
  it('should suport simple date', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2005,1,31)'],
    ])

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('01/31/2005');

  });

  it('should support nonleap year 1990 ', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(1900,02,29)'],

    ]);
    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('12/30/1899');

  });

  //bug to report
  it('should suport leap years', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2020,29,02)'],
      ['=DATE(2021,29,02)'],
    ]);

    expect(dateNumberToString(engine.getCellValue(adr('A1')))).toEqual('12/30/1899');
    expect(dateNumberToString(engine.getCellValue(adr('A2')))).toEqual('12/30/1899');

  });


});





