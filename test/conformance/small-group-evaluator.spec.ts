import { Config, HyperFormula, DetailedCellError } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'
import { CellError, ErrorType } from '../../src/Cell'

// Data and test scenarios were part of the working draft for OpenFormula standard
// https://www.oasis-open.org/committees/download.php/16826/openformula-spec-20060221.html
// https://docs.oasis-open.org/office/OpenDocument/v1.3/csprd02/part4-formula/OpenDocument-v1.3-csprd02-part4-formula.html#__RefHeading__711846_826425813

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
  [null, '1', '4'],
  [null, '2', '3'],
  [null, '3', '2'],
  [null, '4', '1'],
]

function createEngine(sheetData: any[][], config?: Config) {
  const engine = HyperFormula.buildFromArray(sheetData, config)

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress));
    },
    getCellFormula(cellAddress: string) {
      return engine.getCellFormula(adr(cellAddress));
    },
  }
}

describe('ODFF 1.3 Small Group Evaluator', () => {
  describe('Basic Limits', () => {
    it('support functions with 30 parameters', () => {
      const engine = createEngine([
        ['=SUM(B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5,B4,B5)'],
        ...data,
      ])

      expect(engine.getCellValue('A1')).toBe(75)
    })

    it('support formulas up to 1024 characters long', () => {
      const engine = createEngine([
        ['=B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+B4+B5+1111'],
        ...data,
      ])

      expect(engine.getCellValue('A1')).toBe(1961)
    })

    it('can handle strings of ASCII characters can be up to 32767+ characters', () => {
      const str = 'x'.repeat(32767)

      const engine = createEngine([
        ['="' + str + '"'],
      ])

      expect((engine.getCellValue('A1') as string).length).toBe(32767)
    });

    it('support at least 7 levels of nesting functions', () => {
      const engine = createEngine([
        ['=SIN(SIN(SIN(SIN(SIN(SIN(SIN(0)))))))'],
        ...data,
      ])

      expect(engine.getCellValue('A1')).toBe(0)
    })

    it('support up to 64 levels of nesting functions', () => {
      function generateNestedFunction(depth: number) {
        return (new Array(depth)).fill('0').reduce((val) => `SIN(${val})`, '0')
      }

      const depth = 64
      const engine = createEngine([
        ['=' + generateNestedFunction(depth)],
      ])

      expect(engine.getCellValue('A1')).toBe(0)
      expect((engine.getCellFormula('A1') as string).length).toBe(depth * 5 + 2)
    })
  })

  xit('Functions should support ommiting optional parameters', () => {
    const engine = createEngine([
      ['=PV(0.05,10,100,0,1)', '=PV(0.05,10,100,,1)'],
      ['=CONCATENATE("A","","B")', '=CONCATENATE("A",,"B")']
    ]);

    // expect(engine.getCellValue('A1')).toBe(810.78);
    expect(engine.getCellValue('A2')).toBe("AB");
    //expect(engine.getCellValue('B2')).toBe("AB");
  });

  xit('Errors should be parsed and propagated', () => {
    const engine = createEngine([
      ['=TRUE'],
    ]);

    expect(engine.getCellValue('A1')).toBe(true);
  });

  xdescribe("Math", () => {
    it('Precision', () => {
      const engine = createEngine([
        ['=0.1', '=0.2', '=0.3', '=1/3', '=2^(-3)'],
        ['=A1+B1', '=A2=C1', '=D1*3',],
        ['=IF(0.1+0.2=0.3, "OK", "NOT OK")',],
        ['=0.3', '=C1', '=A2', '=B2', '=0.1+0.2', '=SUMIF(A4:E4,"=0.3")', '=SUMIF(A4:E4,">0.3")'],
        ['=0.3', '=0.1+0.2', '=SUMIF(A5:B5,"=0.3")']
      ]);

      expect(engine.getCellValue('C5')).toBe(0.6);

      expect(engine.getCellValue('A1')).toBe(0.1);
      expect(engine.getCellValue('B1')).toBe(0.2);
      expect(engine.getCellValue('C1')).toBe(0.3);
      expect(engine.getCellValue('D1')).toBe(0.3333333333333333);
      expect(engine.getCellValue('E1')).toBe(0.125);

      //expect(engine.getCellValue('A2')).toBe(0.3);
      //expect(engine.getCellValue('B2')).toBe(true);
      expect(engine.getCellValue('C2')).toBe(1);

      //expect(engine.getCellValue('A3')).toBe("OK");

      //expect(engine.getCellValue('F4')).toBe(1.5);
      expect(engine.getCellValue('G4')).toBe(0);
    });

    it('can parse a decimal without leading zero', () => {
      const engine = createEngine([
        [".1", '=.2']
      ]);

      expect(engine.getCellValue('A1')).toBe(0.1);
      //expect(engine.getCellValue('B1')).toBe(0.2);
    });
  });

  xdescribe("Section C", () => {
    it('6.3.12 Conversion to Logical', () => {
      const engine = createEngine([
        ['=0=TRUE()', '=0=FALSE()', '=-1=TRUE()', '=-1=FALSE()'],
        ['=TRUE()', '=FALSE()'],
        ['="foo"&PRAWDA()', '="foo"&TRUE()', '=FALSE()', '="foo"&C3'],
        ['="foo"', '=PRAWDA()', '=A1:B1', '=A1&C1'],
      ]);

      // return number as logical, TRUE for <>0, FALSE for 0
      expect(engine.getCellValue('A1')).toBe(false);
      //expect(engine.getCellValue('B1')).toBe(true)
      expect(engine.getCellValue('C1')).toBe(true);
      expect(engine.getCellValue('D1')).toBe(false);
      // return logical as logical
      expect(engine.getCellValue('A2')).toBe(true);
      expect(engine.getCellValue('B2')).toBe(false);
      // return logical as string TRUE or FALSE
      expect(engine.getCellValue('A3')).toBe('fooTRUE');
      expect(engine.getCellValue('B3')).toBe('fooTRUE');
      expect(engine.getCellValue('C3')).toBe('TRUE');
      expect(engine.getCellValue('D3')).toBe('fooFALSE');

    });

    it('6.3.14 Conversion to Text', () => {
      const engine = createEngine([
        ['="foo"&1', '="foo"&1.2', '="1232"+1', '="foo"&C1'],
        ['="foo"'],
        ['="foo"&PRAWDA()', '="foo"&TRUE()', '=FALSE()', '="foo"&C3'],
        ['="foo"', '=PRAWDA()', '=A1:B1', '=A1&C1'],
      ]);

      // return number as text with no whitespace
      expect(engine.getCellValue('A1')).toBe('foo1');
      expect(engine.getCellValue('B1')).toBe('foo1.2');
      expect(engine.getCellValue('D1')).toBe('foo1233');
      // return text as text
      expect(engine.getCellValue('A2')).toBe('foo');
      // return logical as string TRUE or FALSE
      expect(engine.getCellValue('A3')).toBe('fooTRUE');
      expect(engine.getCellValue('B3')).toBe('fooTRUE');
      expect(engine.getCellValue('C3')).toBe('TRUE');
      expect(engine.getCellValue('D3')).toBe('fooFALSE');

    });
  });

  xdescribe("Section D", () => {
    it('6.3.5 Infix Operator Ordered Comparison ("<", "<=", ">", ">=")', () => {
      const engine = createEngine([
        ['=1<2', '=2<2'],
        ['=2>1', '=2>2'],
        ['=1<=2', '=2<=2', '=3<=2'],
        ['=1>=2', '=2>=2', '=3>=2'],
      ]);

      expect(engine.getCellValue('A1')).toBe(true);
      expect(engine.getCellValue('B1')).toBe(false);
      expect(engine.getCellValue('A2')).toBe(true);
      expect(engine.getCellValue('B2')).toBe(false);
      expect(engine.getCellValue('A3')).toBe(true);
      expect(engine.getCellValue('B3')).toBe(true);
      expect(engine.getCellValue('C3')).toBe(false);
      expect(engine.getCellValue('A4')).toBe(false);
      expect(engine.getCellValue('B4')).toBe(true);
      expect(engine.getCellValue('C4')).toBe(true);
    });
    it('6.4.10 Infix Operator &', () => {
      const engine = createEngine([
        ['="foo"&"bar"'],
      ]);

      expect(engine.getCellValue('A1')).toBe('foobar');
    });
    it('6.4.2 Infix Operator +', () => {
      const engine = createEngine([
        ['=2+3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(5);
    });
    it('6.4.3 Infix Operator -', () => {
      const engine = createEngine([
        ['=8-3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(5);
    });
    it('6.4.4 Infix Operator *', () => {
      const engine = createEngine([
        ['=8*3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(24);
    });
    it('6.4.5 Infix Operator /', () => {
      const engine = createEngine([
        ['=9/3', '=9/-3', '=9/(4-1)', '=9/3/3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(3);
      expect(engine.getCellValue('B1')).toBe(-3);
      expect(engine.getCellValue('C1')).toBe(3);
      expect(engine.getCellValue('D1')).toBe(1);
    });
    it('6.4.6 Infix Operator ^', () => {
      const engine = createEngine([
        ['=8^3', '=8^-3', '=8^-(1+2)', '=8^3^2'],
      ]);

      expect(engine.getCellValue('A1')).toBe(512);
      expect(engine.getCellValue('B1')).toBe(0.001953125);
      expect(engine.getCellValue('C1')).toBe(0.001953125);
      expect(engine.getCellValue('D1')).toBe(262144);
    });
    it('6.4.7 Infix Operator =', () => {
      const engine = createEngine([
        ['=1=2', '=1=1'],
      ]);

      expect(engine.getCellValue('A1')).toBe(false);
      expect(engine.getCellValue('B1')).toBe(true);
    });
    it('6.4.8 Infix Operator <>”', () => {
      const engine = createEngine([
        ['=1<>2', '=1<>1'],
      ]);

      expect(engine.getCellValue('A1')).toBe(true);
      expect(engine.getCellValue('B1')).toBe(false);
    });
    it('6.4.14 Postfix Operator %', () => {
      const engine = createEngine([
        ['=3%'],
      ]);

      expect(engine.getCellValue('A1')).toBe(0.03);
    });
    xit('6.4.15 Prefix Operator +', () => {
      const engine = createEngine([
        ['=+3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(3);
    });
    it('6.4.16 Prefix Operator -', () => {
      const engine = createEngine([
        ['=-3'],
      ]);

      expect(engine.getCellValue('A1')).toBe(-3);
    });
    xit('6.4.12 Infix Operator Reference Intersection !', () => {
      const engine = createEngine([
        ['=1', '=2', '=A1:A2!B1:B2'],
      ]);

      expect(engine.getCellValue('A1')).toBe(-3);
    });
    xit('6.4.11 Infix Operator Range :', () => {
      const engine = createEngine([
        ['', '=1', '=A1:A2', '=B1:B2'],
        ['=2', '=2']
      ]);

      expect(engine.getCellValue('C1')).toBe(2);
      expect(engine.getCellValue('D1')).toBe(3);
    });
  });

  describe("Section E", () => {
    it('6.16.2 ABS function', () => {
      const engine = createEngine([
        ['=ABS(-4)', '=ABS(4)'],
      ]);

      expect(engine.getCellValue('A1')).toBe(4);
      expect(engine.getCellValue('B1')).toBe(4);
    });
    it('6.16.2 ABS fun should support relative references', () => {
      const engine = createEngine([
        ['-4', 4],
        ['=ABS(A1)', '=ABS(B1)']
      ]);

      expect(engine.getCellValue('A2')).toBe(4);
      expect(engine.getCellValue('B2')).toBe(4);
    });
    it('6.16.3 ACOS function', () => {
      const engine = createEngine([
        ['=ACOS(SQRT(2)/2)*4/PI()'],
        ['=ACOS(TRUE())'],
        ['=ACOS(-1.0)/PI()'],
        ['=ACOS(2.0)']
      ]);

      expect(engine.getCellValue('A1')).toBe(1);
      expect(engine.getCellValue('A2')).toBe(0.0);
      expect(engine.getCellValue('A3')).toBe(1);
      expect(engine.getCellValue('A4')).toEqual(new DetailedCellError(new CellError(ErrorType.NUM), '#NUM!'));
    });
    it('6.16.3 ACOS should support relative references', () => {
      const engine = createEngine([
        ['=ACOS(B7)'],
        ...data
      ]);

      expect(engine.getCellValue('A1')).toEqual(new DetailedCellError(new CellError(ErrorType.VALUE), '#VALUE!'));
    });

    


  });
});


