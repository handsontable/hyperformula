import {HyperFormula} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe('Interpreter', () => {
  it('relative addressing formula', () => {
    const engine = HyperFormula.buildFromArray([['42', '=A1']])

    expect(engine.getCellValue(adr('B1'))).toBe(42)
  })

  it('number literal', () => {
    const engine = HyperFormula.buildFromArray([['3']])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
  })

  it('negative number literal', () => {
    const engine = HyperFormula.buildFromArray([['=-3']])

    expect(engine.getCellValue(adr('A1'))).toBe(-3)
  })

  it('negative number literal - non numeric value', () => {
    const engine = HyperFormula.buildFromArray([['=-"foo"']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('string literals', () => {
    const engine = HyperFormula.buildFromArray([
      ['www', '1www', 'www1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('www')
    expect(engine.getCellValue(adr('B1'))).toBe('1www')
    expect(engine.getCellValue(adr('C1'))).toBe('www1')
  })

  it('string literals in formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['="www"', '="1www"', '="www1"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('www')
    expect(engine.getCellValue(adr('B1'))).toBe('1www')
    expect(engine.getCellValue(adr('C1'))).toBe('www1')
  })

  it('ranges - VALUE error when evaluating without context', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['2'], ['=A1:A2']])
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('procedures - SUM with bad args', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('procedures - not known procedure', () => {
    const engine = HyperFormula.buildFromArray([['=FOO()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('errors - parsing errors', () => {
    const engine = HyperFormula.buildFromArray([['=A', '=A1C1', '=SUM(A)', '=foo', '=)(asdf']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('D1'))).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue(adr('E1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('function TRUE', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('function TRUE is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function FALSE', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('function FALSE is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function ACOS happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('function ACOS when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function ACOS for 1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('function ACOS for -1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(Math.PI)
  })

  it('function ACOS when value too large', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('function ACOS when value too small', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(-1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('function ACOS happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('function ACOS wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS()', '=ACOS(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function IF when value is true', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('function IF when value is false', () => {
    const engine = HyperFormula.buildFromArray([['=IF(FALSE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('no')
  })

  it('function IF when condition is weird type', () => {
    const engine = HyperFormula.buildFromArray([['=IF("foo", "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function IF when condition is number', () => {
    const engine = HyperFormula.buildFromArray([['=IF(1, "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('function IF when condition is logic function', () => {
    const engine = HyperFormula.buildFromArray([['=IF(OR(1, FALSE()), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('function IF works when only first part is given', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('function IF works when only first part is given and condition is falsey', () => {
    const engine = HyperFormula.buildFromArray([['=IF(FALSE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('function ISERROR should return true for common errors', () => {
    const engine = HyperFormula.buildFromArray([
        ['=ISERROR(1/0)', '=ISERROR(FOO())', '=ISERROR(TRUE(1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('function ISERROR should return false for valid formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISERROR(1)', '=ISERROR(TRUE())',  '=ISERROR("foo")', '=ISERROR(ISERROR(1/0))', '=ISERROR(A1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
    expect(engine.getCellValue(adr('E1'))).toEqual(false)
  })

  it('function ISERROR takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
        ['=ISERROR(1, 2)', '=ISERROR()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function AND usage', () => {
    const engine = HyperFormula.buildFromArray([
        ['=AND(TRUE(), TRUE())', '=AND(TRUE(), FALSE())', '=AND(TRUE(), "asdf")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function AND with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([
        ['=AND(1)', '=AND(0)', '=AND(1, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('function AND takes at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AND()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function OR usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR(TRUE())', '=OR(FALSE())', '=OR(FALSE(), TRUE(), FALSE())', '=OR("asdf")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function OR with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR(1)', '=OR(0)', '=OR(FALSE(), 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('function OR takes at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function COLUMNS works', () => {
    const engine = HyperFormula.buildFromArray([['=COLUMNS(A1:C2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('function COLUMNS returns error when argument of invalid type', () => {
    const engine = HyperFormula.buildFromArray([['=COLUMNS(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function COLUMNS accepts exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([['=COLUMNS()', '=COLUMNS(A1:B1, A2:B2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('function OFFSET basic use', () => {
    const engine = HyperFormula.buildFromArray([['5', '=OFFSET(B1, 0, -1)', '=OFFSET(A1, 0, 0)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(5)
    expect(engine.getCellValue(adr('C1'))).toEqual(5)
  })

  it('function OFFSET out of range', () => {
    const engine = HyperFormula.buildFromArray([['=OFFSET(A1, -1, 0)', '=OFFSET(A1, 0, -1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.REF))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.REF))
  })

  it('function OFFSET returns bigger range', () => {
      const engine = HyperFormula.buildFromArray([
          ['=SUM(OFFSET(A1, 0, 1,2,1))', '5', '6'],
          ['2', '3', '4'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(8)
  })

  it('function OFFSET returns rectangular range and fails', () => {
    const engine = HyperFormula.buildFromArray([
        ['=OFFSET(A1, 0, 1,2,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('function OFFSET used twice in a range', () => {
    const engine = HyperFormula.buildFromArray([
        ['5', '6', '=SUM(OFFSET(A2,-1,0):OFFSET(A2,0,1))'],
        ['2', '3', '4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(16)
  })

  it('function OFFSET as a reference inside SUM', () => {
      const engine = HyperFormula.buildFromArray([
          ['0', '0', '10'],
          ['5', '6', '=SUM(SUM(OFFSET(C2,-1,0),A2),-B2)'],
      ])

      expect(engine.getCellValue(adr('C2'))).toEqual(9)
  })

  it('initializing engine with multiple sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet1.B2)'],
      ],
    })
    expect(engine.getCellValue(adr('A1', 1))).toEqual(6)
  })

  it('using bad range reference', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet2.A2)'],
        [''],
      ],
    })
    expect(engine.getCellValue(adr('A1', 1))).toEqual(new CellError(ErrorType.VALUE))
  })
})
