import {HandsOnEngine} from '../src'
import {cellError, ErrorType} from '../src/Cell'
import './testConfig'

describe('Interpreter', () => {
  it('relative addressing formula', () => {
    const engine = HandsOnEngine.buildFromArray([['42', '=A1']])

    expect(engine.getCellValue('B1')).toBe(42)
  })

  it('number literal', () => {
    const engine = HandsOnEngine.buildFromArray([['3']])

    expect(engine.getCellValue('A1')).toBe(3)
  })

  it('negative number literal', () => {
    const engine = HandsOnEngine.buildFromArray([['=-3']])

    expect(engine.getCellValue('A1')).toBe(-3)
  })

  it('negative number literal - non numeric value', () => {
    const engine = HandsOnEngine.buildFromArray([['=-"foo"']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('string literals', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['www', '1www', 'www1'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('string literals in formula', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['="www"', '="1www"', '="www1"'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('plus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '7', '=A1+B1']])

    expect(engine.getCellValue('C1')).toBe(10)
  })

  it('plus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '=A1+42']])

    expect(engine.getCellValue('B1')).toBe(45)
  })

  it('plus operator - int + float', () => {
    const engine = HandsOnEngine.buildFromArray([['2.0', '=A1 + 3.14']])

    expect(engine.getCellValue('B1')).toBeCloseTo(5.14)
  })

  it('plus operator - VALUE error on 1st operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=A1+42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('plus operator - VALUE error on 2nd operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=42+A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('minus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '=A1-43']])

    expect(engine.getCellValue('B1')).toBe(-40)
  })

  it('minus operator - VALUE error on 1st operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=A1-42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('minus operator - VALUE error on 2nd operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=42-A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('times operator', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '=A1*6']])

    expect(engine.getCellValue('B1')).toBe(18)
  })

  it('times operator - VALUE error on 1st operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=A1*42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('times operator - VALUE error on 2nd operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=42*A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('div operator - int result', () => {
    const engine = HandsOnEngine.buildFromArray([['=10 / 2']])

    expect(engine.getCellValue('A1')).toEqual(5)
  })

  it('div operator - float result', () => {
    const engine = HandsOnEngine.buildFromArray([['=5 / 2']])

    expect(engine.getCellValue('A1')).toEqual(2.5)
  })

  it('div operator - float arg and result', () => {
    const engine = HandsOnEngine.buildFromArray([['=12 / 2.5']])

    expect(engine.getCellValue('A1')).toEqual(4.8)
  })

  it('div operator - DIV_ZERO error', () => {
    const engine = HandsOnEngine.buildFromArray([['=42 / 0']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('div operator - VALUE error on 1st operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=A1 / 42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('div operator - VALUE error on 2nd operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=42 / A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('power operator', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '=2^A1']])

    expect(engine.getCellValue('B1')).toBe(8)
  })

  it('power operator - VALUE error on 1st operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=A1^3']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('power operator - VALUE error on 2nd operand', () => {
    const engine = HandsOnEngine.buildFromArray([['www', '=2^A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('procedures - SUM without args', () => {
    const engine = HandsOnEngine.buildFromArray([['=SUM()']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('procedures - SUM with args', () => {
    const engine = HandsOnEngine.buildFromArray([['=SUM(1, B1)', '3.14']])

    expect(engine.getCellValue('A1')).toBeCloseTo(4.14)
  })

  it('procedures - SUM with range args', () => {
    const engine = HandsOnEngine.buildFromArray([['1', '2', '5'],
                      ['3', '4', '=SUM(A1:B2)']])
    expect(engine.getCellValue('C2')).toEqual(10)
  })

  it('procedures - SUM with using previously cached value', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '=SUM(A1:A1)'],
      ['4', '=SUM(A1:A2)'],
    ])
    expect(engine.getCellValue('B2')).toEqual(7)
  })

  it('ranges - VALUE error when evaluating without context', () => {
    const engine = HandsOnEngine.buildFromArray([['1'], ['2'], ['=A1:A2']])
    expect(engine.getCellValue('A3')).toEqual(cellError(ErrorType.VALUE))
  })

  it('procedures - SUM with bad args', () => {
    const engine = HandsOnEngine.buildFromArray([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('ranges - SUM with bool', () => {
    const engine = HandsOnEngine.buildFromArray([['=SUM(1,TRUE())']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('ranges - SUM with string', () => {
    const engine = HandsOnEngine.buildFromArray([['=SUM(1,"foo")']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('ranges - SUM and + of 1 with "foo"', () => {
      const engine = HandsOnEngine.buildFromArray([
          ['1', 'foo'],
          ['=A1+B1', '=SUM(A1:B1)'],
    ])
      expect(engine.getCellValue('A2')).toEqual(cellError(ErrorType.VALUE))
      expect(engine.getCellValue('B2')).toEqual(1)
  })

  it('ranges - SUM range with string values', () => {
    const engine = HandsOnEngine.buildFromArray([['1'], ['2'], ['foo'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('ranges - SUM range with bool values', () => {
    const engine = HandsOnEngine.buildFromArray([['1'], ['2'], ['=TRUE()'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('procedures - not known procedure', () => {
    const engine = HandsOnEngine.buildFromArray([['=FOO()']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
  })

  it('errors - parsing errors', () => {
    const engine = HandsOnEngine.buildFromArray([['=A', '=A1C1', '=SUM(A)', '=foo', '=)(asdf']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('D1')).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue('E1')).toEqual(cellError(ErrorType.NAME))
  })

  it('function TRUE', () => {
    const engine = HandsOnEngine.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue('A1')).toEqual(true)
  })

  it('function TRUE is 0-arity', () => {
    const engine = HandsOnEngine.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function FALSE', () => {
    const engine = HandsOnEngine.buildFromArray([['=FALSE()']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function FALSE is 0-arity', () => {
    const engine = HandsOnEngine.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function ACOS happy path', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS when value not numeric', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS("foo")']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function ACOS for 1 (edge)', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS for -1 (edge)', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(-1)']])

    expect(engine.getCellValue('A1')).toEqual(Math.PI)
  })

  it('function ACOS when value too large', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(1.1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NUM))
  })

  it('function ACOS when value too small', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(-1.1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NUM))
  })

  it('function ACOS happy path', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS wrong number of arguments', () => {
    const engine = HandsOnEngine.buildFromArray([['=ACOS()', '=ACOS(1,-1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NA))
  })

  it('function IF when value is true', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(TRUE(), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF when value is false', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(FALSE(), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('no')
  })

  it('function IF when condition is weird type', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF("foo", "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function IF when condition is number', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(1, "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF when condition is logic function', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(OR(1, FALSE()), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF works when only first part is given', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(TRUE(), "yes")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF works when only first part is given and condition is falsey', () => {
    const engine = HandsOnEngine.buildFromArray([['=IF(FALSE(), "yes")']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function CONCATENATE by default returns empty string', () => {
    const engine = HandsOnEngine.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue('A1')).toEqual('')
  })

  it('function CONCATENATE works', () => {
    const engine = HandsOnEngine.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual('JohnSmith')
  })

  it('function CONCATENATE returns error if one of the arguments is error', () => {
    const engine = HandsOnEngine.buildFromArray([['John', '=1/0', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('function ISERROR should return true for common errors', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['=ISERROR(1/0)', '=ISERROR(FOO())', '=ISERROR(TRUE(1))'],
    ])

    expect(engine.getCellValue('A1')).toEqual(true)
    expect(engine.getCellValue('B1')).toEqual(true)
    expect(engine.getCellValue('C1')).toEqual(true)
  })

  it('function ISERROR should return false for valid formulas', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=ISERROR(1)', '=ISERROR(TRUE())',  '=ISERROR("foo")', '=ISERROR(ISERROR(1/0))', '=ISERROR(A1)'],
    ])
    expect(engine.getCellValue('A1')).toEqual(false)
    expect(engine.getCellValue('B1')).toEqual(false)
    expect(engine.getCellValue('C1')).toEqual(false)
    expect(engine.getCellValue('D1')).toEqual(false)
    expect(engine.getCellValue('E1')).toEqual(false)
  })

  it('function ISERROR takes exactly one argument', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['=ISERROR(1, 2)', '=ISERROR()'],
    ])
    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NA))
  })

  it('function AND usage', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['=AND(TRUE(), TRUE())', '=AND(TRUE(), FALSE())', '=AND(TRUE(), "asdf")'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })

  it ('function AND with numerical arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['=AND(1)', '=AND(0)', '=AND(1, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('function AND takes at least one argument', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=AND()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function OR usage', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=OR(TRUE())', '=OR(FALSE())', '=OR(FALSE(), TRUE(), FALSE())', '=OR("asdf")'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toEqual(cellError(ErrorType.VALUE))
  })

  it ('function OR with numerical arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=OR(1)', '=OR(0)', '=OR(FALSE(), 42)'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('function OR takes at least one argument', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=OR()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('function COLUMNS works', () => {
    const engine = HandsOnEngine.buildFromArray([['=COLUMNS(A1:C2)']])

    expect(engine.getCellValue('A1')).toEqual(3)
  })

  it('function COLUMNS returns error when argument of invalid type', () => {
    const engine = HandsOnEngine.buildFromArray([['=COLUMNS(A1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function COLUMNS accepts exactly one argument', () => {
    const engine = HandsOnEngine.buildFromArray([['=COLUMNS()', '=COLUMNS(A1:B1, A2:B2)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NA))
  })

  it('function OFFSET basic use', () => {
    const engine = HandsOnEngine.buildFromArray([['5', '=OFFSET(B1, 0, -1)', '=OFFSET(A1, 0, 0)']])

    expect(engine.getCellValue('B1')).toEqual(5)
    expect(engine.getCellValue('C1')).toEqual(5)
  })

  it ('function OFFSET out of range', () => {
    const engine = HandsOnEngine.buildFromArray([['=OFFSET(A1, -1, 0)', '=OFFSET(A1, 0, -1)']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.REF))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.REF))
  })

  it ('function OFFSET returns bigger range', () => {
      const engine = HandsOnEngine.buildFromArray([
          ['=SUM(OFFSET(A1, 0, 1,2,1))', '5', '6'],
          ['2', '3', '4'],
      ])

      expect(engine.getCellValue('A1')).toEqual(8)
  })

  it ('function OFFSET returns rectangular range and fails', () => {
      const engine = HandsOnEngine.buildFromArray([
          ['=OFFSET(A1, 0, 1,2,1))'],
      ])

      expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
  })

  it ('function OFFSET used twice in a range', () => {
      const engine = HandsOnEngine.buildFromArray([
          ['5', '6', '=SUM(OFFSET(A2,-1,0):OFFSET(A2,0,1))'],
          ['2', '3', '4'],
      ])

      expect(engine.getCellValue('C1')).toEqual(16)
  })

  it ('function OFFSET as a reference inside SUM', () => {
      const engine = HandsOnEngine.buildFromArray([
          ['0', '0', '10'],
          ['5', '6', '=SUM(SUM(OFFSET(C2,-1,0),A2),-B2)'],
      ])

      expect(engine.getCellValue('C2')).toEqual(9)
  })

  it('initializing engine with multiple sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet1.B2)']
      ]
    })
    expect(engine.getCellValue('$Sheet2.A1')).toEqual(6)
  })

  it('using bad range reference', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet2.A2)'],
        [''],
      ]
    })
    expect(engine.getCellValue('$Sheet2.A1')).toEqual(cellError(ErrorType.VALUE))
  })
})
