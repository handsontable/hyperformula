import {HandsOnEngine} from '../src'
import {cellError, ErrorType} from '../src/Cell'

describe('Interpreter', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it('relative addressing formula', () => {
    engine.loadSheet([['42', '=A1']])

    expect(engine.getCellValue('B1')).toBe(42)
  })

  it('number literal', () => {
    engine.loadSheet([['3']])

    expect(engine.getCellValue('A1')).toBe(3)
  })

  it('negative number literal', () => {
    engine.loadSheet([['=-3']])

    expect(engine.getCellValue('A1')).toBe(-3)
  })

  it('negative number literal - non numeric value', () => {
    engine.loadSheet([['=-"foo"']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('string literals', () => {
    engine.loadSheet([
      ['www', '1www', 'www1'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('string literals in formula', () => {
    engine.loadSheet([
      ['="www"', '="1www"', '="www1"'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('plus operator', () => {
    engine.loadSheet([['3', '7', '=A1+B1']])

    expect(engine.getCellValue('C1')).toBe(10)
  })

  it('plus operator', () => {
    engine.loadSheet([['3', '=A1+42']])

    expect(engine.getCellValue('B1')).toBe(45)
  })

  it('plus operator - int + float', () => {
    engine.loadSheet([['2.0', '=A1 + 3.14']])

    expect(engine.getCellValue('B1')).toBeCloseTo(5.14)
  })

  it('plus operator - VALUE error on 1st operand', () => {
    engine.loadSheet([['www', '=A1+42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('plus operator - VALUE error on 2nd operand', () => {
    engine.loadSheet([['www', '=42+A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('minus operator', () => {
    engine.loadSheet([['3', '=A1-43']])

    expect(engine.getCellValue('B1')).toBe(-40)
  })

  it('minus operator - VALUE error on 1st operand', () => {
    engine.loadSheet([['www', '=A1-42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('minus operator - VALUE error on 2nd operand', () => {
    engine.loadSheet([['www', '=42-A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('times operator', () => {
    engine.loadSheet([['3', '=A1*6']])

    expect(engine.getCellValue('B1')).toBe(18)
  })

  it('times operator - VALUE error on 1st operand', () => {
    engine.loadSheet([['www', '=A1*42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('times operator - VALUE error on 2nd operand', () => {
    engine.loadSheet([['www', '=42*A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('div operator - int result', () => {
    engine.loadSheet([['=10 / 2']])

    expect(engine.getCellValue('A1')).toEqual(5)
  })

  it('div operator - float result', () => {
    engine.loadSheet([['=5 / 2']])

    expect(engine.getCellValue('A1')).toEqual(2.5)
  })

  it('div operator - float arg and result', () => {
    engine.loadSheet([['=12 / 2.5']])

    expect(engine.getCellValue('A1')).toEqual(4.8)
  })

  it('div operator - DIV_ZERO error', () => {
    engine.loadSheet([['=42 / 0']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('div operator - VALUE error on 1st operand', () => {
    engine.loadSheet([['www', '=A1 / 42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('div operator - VALUE error on 2nd operand', () => {
    engine.loadSheet([['www', '=42 / A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('procedures - SUM without args', () => {
    engine.loadSheet([['=SUM()']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('procedures - SUM with args', () => {
    engine.loadSheet([['=SUM(1; B1)', '3.14']])

    expect(engine.getCellValue('A1')).toBeCloseTo(4.14)
  })

  it('procedures - SUM with range args', () => {
    engine.loadSheet([['1', '2', '5'],
                      ['3', '4', '=SUM(A1:B2)']])
    expect(engine.getCellValue('C2')).toEqual(10)
  })

  it('ranges - VALUE error when evaluating without context', () => {
    engine.loadSheet([['1'], ['2'], ['=A1:A2']])
    expect(engine.getCellValue('A3')).toEqual(cellError(ErrorType.VALUE))
  })

  it('procedures - SUM with bad args', () => {
    engine.loadSheet([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('ranges - SUM range with not numeric values', () => {
    engine.loadSheet([['1'], ['2'], ['foo'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(cellError(ErrorType.VALUE))
  })

  it('procedures - not known procedure', () => {
    engine.loadSheet([['=FOO()']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
  })

  it('errors - parsing errors', () => {
    engine.loadSheet([['=A', '=A1C1', '=SUM(A)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.NAME))
  })

  it('function TRUE', () => {
    engine.loadSheet([['=TRUE()']])

    expect(engine.getCellValue('A1')).toEqual(true)
  })

  it('function TRUE is 0-arity', () => {
    engine.loadSheet([['=TRUE(1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function FALSE', () => {
    engine.loadSheet([['=FALSE()']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function FALSE is 0-arity', () => {
    engine.loadSheet([['=FALSE(1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function ACOS happy path', () => {
    engine.loadSheet([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('function ACOS when value not numeric', () => {
    engine.loadSheet([['=ACOS("foo")']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NUM))
  })

  it('function ACOS for 1 (edge)', () => {
    engine.loadSheet([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('function ACOS for -1 (edge)', () => {
    engine.loadSheet([['=ACOS(-1)']])

    expect(engine.getCellValue('A1')).toEqual(Math.PI)
  })

  it('function ACOS when value too large', () => {
    engine.loadSheet([['=ACOS(1.1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NUM))
  })

  it('function ACOS when value too small', () => {
    engine.loadSheet([['=ACOS(-1.1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NUM))
  })

  it('function IF when value is true', () => {
    engine.loadSheet([['=IF(TRUE(); "yes"; "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF when value is false', () => {
    engine.loadSheet([['=IF(FALSE(); "yes"; "no")']])

    expect(engine.getCellValue('A1')).toEqual('no')
  })

  it('function IF when condition is weird type', () => {
    engine.loadSheet([['=IF("foo"; "yes"; "no")']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function IF works when only first part is given', () => {
    engine.loadSheet([['=IF(TRUE(); "yes")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF works when only first part is given and condition is falsey', () => {
    engine.loadSheet([['=IF(FALSE(); "yes")']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function CONCATENATE by default returns empty string', () => {
    engine.loadSheet([['=CONCATENATE()']])

    expect(engine.getCellValue('A1')).toEqual('')
  })

  it('function CONCATENATE works', () => {
    engine.loadSheet([['John', 'Smith', '=CONCATENATE(A1; B1)']])

    expect(engine.getCellValue('C1')).toEqual('JohnSmith')
  })

  it('function CONCATENATE returns error if one of the arguments is error', () => {
    engine.loadSheet([['John', '=1/0', '=CONCATENATE(A1; B1)']])

    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SUMIF error when 1st arg is not a range', () => {
    engine.loadSheet([
      ['=SUMIF(42; ">0"; B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SUMIF error when 2nd arg is not a string', () => {
    engine.loadSheet([
      ['=SUMIF(C1:C2; 78; B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SUMIF error when 3rd arg is not a range', () => {
    engine.loadSheet([
      ['=SUMIF(C1:C2; ">0"; 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SUMIF error when criterion unparsable', () => {
    engine.loadSheet([
      ['=SUMIF(B1:B2; "%"; C1:C2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SUMIF usage of greater than operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; ">1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(7)
  })

  it('function SUMIF usage of greater than or equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; ">=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(12)
  })

  it('function SUMIF usage of less than operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A2; "<1"; B1:B2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('function SUMIF usage of less than or equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "<=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(8)
  })

  it('function SUMIF usage of equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('function SUMIF usage of not equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "<>1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })

  it('function COUNTIF usage', () => {
    engine.loadSheet([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3; ">=1")'],
    ])

    expect(engine.getCellValue('A4')).toEqual(2)
  })

  it('function COUNTIF error when 1st arg is not a range', () => {
    engine.loadSheet([
      ['=COUNTIF(42; ">0")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function COUNTIF error when 2nd arg is not a string', () => {
    engine.loadSheet([
      ['=COUNTIF(C1:C2; 78)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function COUNTIF error when criterion unparsable', () => {
    engine.loadSheet([
      ['=COUNTIF(B1:B2; "%")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function ISERROR should return true for common errors', () => {
    engine.loadSheet([
        ['=ISERROR(1/0)', '=ISERROR(FOO())', '=ISERROR(SUM("foo"))', '=ISERROR(TRUE(1))'],
    ])

    expect(engine.getCellValue('A1')).toEqual(true)
    expect(engine.getCellValue('B1')).toEqual(true)
    expect(engine.getCellValue('C1')).toEqual(true)
    expect(engine.getCellValue('D1')).toEqual(true)
  })

  it('function ISERROR should return false', () => {
    engine.loadSheet([
      ['=ISERROR(1)', '=ISERROR(TRUE())',  '=ISERROR("foo")', '=ISERROR(ISERROR(1/0))', '=ISERROR(A1)'],
    ])
    expect(engine.getCellValue('A1')).toEqual(false)
    expect(engine.getCellValue('B1')).toEqual(false)
    expect(engine.getCellValue('C1')).toEqual(false)
    expect(engine.getCellValue('D1')).toEqual(false)
    expect(engine.getCellValue('E1')).toEqual(false)
  })

  it('function ISERROR takes exactly one argument', () => {
    engine.loadSheet([
        ['=ISERROR(1; 2)', '=ISERROR()'],
    ])
    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NA))
  })
})
