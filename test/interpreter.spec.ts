import {HandsOnEngine} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import './testConfig'

describe('Interpreter', () => {
  it('relative addressing formula', async () => {
    const engine = await HandsOnEngine.buildFromArray([['42', '=A1']])

    expect(engine.getCellValue('B1')).toBe(42)
  })

  it('number literal', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3']])

    expect(engine.getCellValue('A1')).toBe(3)
  })

  it('negative number literal', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=-3']])

    expect(engine.getCellValue('A1')).toBe(-3)
  })

  it('negative number literal - non numeric value', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=-"foo"']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('string literals', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['www', '1www', 'www1'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('string literals in formula', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="www"', '="1www"', '="www1"'],
    ])

    expect(engine.getCellValue('A1')).toBe('www')
    expect(engine.getCellValue('B1')).toBe('1www')
    expect(engine.getCellValue('C1')).toBe('www1')
  })

  it('plus operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '7', '=A1+B1']])

    expect(engine.getCellValue('C1')).toBe(10)
  })

  it('plus operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '=A1+42']])

    expect(engine.getCellValue('B1')).toBe(45)
  })

  it('plus operator - int + float', async () => {
    const engine = await HandsOnEngine.buildFromArray([['2.0', '=A1 + 3.14']])

    expect(engine.getCellValue('B1')).toBeCloseTo(5.14)
  })

  it('plus operator - VALUE error on 1st operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=A1+42']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('plus operator - VALUE error on 2nd operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=42+A1']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('minus operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '=A1-43']])

    expect(engine.getCellValue('B1')).toBe(-40)
  })

  it('minus operator - VALUE error on 1st operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=A1-42']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('minus operator - VALUE error on 2nd operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=42-A1']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('times operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '=A1*6']])

    expect(engine.getCellValue('B1')).toBe(18)
  })

  it('times operator - VALUE error on 1st operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=A1*42']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('times operator - VALUE error on 2nd operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=42*A1']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('div operator - int result', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=10 / 2']])

    expect(engine.getCellValue('A1')).toEqual(5)
  })

  it('div operator - float result', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=5 / 2']])

    expect(engine.getCellValue('A1')).toEqual(2.5)
  })

  it('div operator - float arg and result', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=12 / 2.5']])

    expect(engine.getCellValue('A1')).toEqual(4.8)
  })

  it('div operator - DIV_ZERO error', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=42 / 0']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('div operator - VALUE error on 1st operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=A1 / 42']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('div operator - VALUE error on 2nd operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=42 / A1']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('power operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '=2^A1']])

    expect(engine.getCellValue('B1')).toBe(8)
  })

  it('power operator - VALUE error on 1st operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=A1^3']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('power operator - VALUE error on 2nd operand', async () => {
    const engine = await HandsOnEngine.buildFromArray([['www', '=2^A1']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('ranges - VALUE error when evaluating without context', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['2'], ['=A1:A2']])
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('procedures - SUM with bad args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('procedures - not known procedure', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=FOO()']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME))
  })

  it('errors - parsing errors', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=A', '=A1C1', '=SUM(A)', '=foo', '=)(asdf']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue('D1')).toEqual(new CellError(ErrorType.NAME))
    expect(engine.getCellValue('E1')).toEqual(new CellError(ErrorType.NAME))
  })

  it('function TRUE', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=TRUE()']])

    expect(engine.getCellValue('A1')).toEqual(true)
  })

  it('function TRUE is 0-arity', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=TRUE(1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function FALSE', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=FALSE()']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function FALSE is 0-arity', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function ACOS happy path', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS when value not numeric', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS("foo")']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function ACOS for 1 (edge)', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS for -1 (edge)', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(-1)']])

    expect(engine.getCellValue('A1')).toEqual(Math.PI)
  })

  it('function ACOS when value too large', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(1.1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NUM))
  })

  it('function ACOS when value too small', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(-1.1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NUM))
  })

  it('function ACOS happy path', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue('A1')).toBe(0)
  })

  it('function ACOS wrong number of arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=ACOS()', '=ACOS(1,-1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function IF when value is true', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(TRUE(), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF when value is false', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(FALSE(), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('no')
  })

  it('function IF when condition is weird type', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF("foo", "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function IF when condition is number', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(1, "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF when condition is logic function', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(OR(1, FALSE()), "yes", "no")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF works when only first part is given', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(TRUE(), "yes")']])

    expect(engine.getCellValue('A1')).toEqual('yes')
  })

  it('function IF works when only first part is given and condition is falsey', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=IF(FALSE(), "yes")']])

    expect(engine.getCellValue('A1')).toEqual(false)
  })

  it('function CONCATENATE by default returns empty string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue('A1')).toEqual('')
  })

  it('function CONCATENATE works', async () => {
    const engine = await HandsOnEngine.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual('JohnSmith')
  })

  it('function CONCATENATE returns error if one of the arguments is error', async () => {
    const engine = await HandsOnEngine.buildFromArray([['John', '=1/0', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('function ISERROR should return true for common errors', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=ISERROR(1/0)', '=ISERROR(FOO())', '=ISERROR(TRUE(1))'],
    ])

    expect(engine.getCellValue('A1')).toEqual(true)
    expect(engine.getCellValue('B1')).toEqual(true)
    expect(engine.getCellValue('C1')).toEqual(true)
  })

  it('function ISERROR should return false for valid formulas', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=ISERROR(1)', '=ISERROR(TRUE())',  '=ISERROR("foo")', '=ISERROR(ISERROR(1/0))', '=ISERROR(A1)'],
    ])
    expect(engine.getCellValue('A1')).toEqual(false)
    expect(engine.getCellValue('B1')).toEqual(false)
    expect(engine.getCellValue('C1')).toEqual(false)
    expect(engine.getCellValue('D1')).toEqual(false)
    expect(engine.getCellValue('E1')).toEqual(false)
  })

  it('function ISERROR takes exactly one argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=ISERROR(1, 2)', '=ISERROR()'],
    ])
    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function AND usage', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=AND(TRUE(), TRUE())', '=AND(TRUE(), FALSE())', '=AND(TRUE(), "asdf")'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function AND with numerical arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=AND(1)', '=AND(0)', '=AND(1, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('function AND takes at least one argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=AND()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function OR usage', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=OR(TRUE())', '=OR(FALSE())', '=OR(FALSE(), TRUE(), FALSE())', '=OR("asdf")'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function OR with numerical arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=OR(1)', '=OR(0)', '=OR(FALSE(), 42)'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('function OR takes at least one argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=OR()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function COLUMNS works', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=COLUMNS(A1:C2)']])

    expect(engine.getCellValue('A1')).toEqual(3)
  })

  it('function COLUMNS returns error when argument of invalid type', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=COLUMNS(A1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function COLUMNS accepts exactly one argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=COLUMNS()', '=COLUMNS(A1:B1, A2:B2)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.NA))
  })

  it('function OFFSET basic use', async () => {
    const engine = await HandsOnEngine.buildFromArray([['5', '=OFFSET(B1, 0, -1)', '=OFFSET(A1, 0, 0)']])

    expect(engine.getCellValue('B1')).toEqual(5)
    expect(engine.getCellValue('C1')).toEqual(5)
  })

  it('function OFFSET out of range', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=OFFSET(A1, -1, 0)', '=OFFSET(A1, 0, -1)']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.REF))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.REF))
  })

  it('function OFFSET returns bigger range', async () => {
      const engine = await HandsOnEngine.buildFromArray([
          ['=SUM(OFFSET(A1, 0, 1,2,1))', '5', '6'],
          ['2', '3', '4'],
      ])

      expect(engine.getCellValue('A1')).toEqual(8)
  })

  it('function OFFSET returns rectangular range and fails', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=OFFSET(A1, 0, 1,2,1))'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME))
  })

  it('function OFFSET used twice in a range', async () => {
      const engine = await HandsOnEngine.buildFromArray([
          ['5', '6', '=SUM(OFFSET(A2,-1,0):OFFSET(A2,0,1))'],
          ['2', '3', '4'],
      ])

      expect(engine.getCellValue('C1')).toEqual(16)
  })

  it('function OFFSET as a reference inside SUM', async () => {
      const engine = await HandsOnEngine.buildFromArray([
          ['0', '0', '10'],
          ['5', '6', '=SUM(SUM(OFFSET(C2,-1,0),A2),-B2)'],
      ])

      expect(engine.getCellValue('C2')).toEqual(9)
  })

  it('initializing engine with multiple sheets', async () => {
    const engine = await HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet1.B2)'],
      ],
    })
    expect(engine.getCellValue('$Sheet2.A1')).toEqual(6)
  })

  it('using bad range reference', async () => {
    const engine = await HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM($Sheet1.A1:$Sheet2.A2)'],
        [''],
      ],
    })
    expect(engine.getCellValue('$Sheet2.A1')).toEqual(new CellError(ErrorType.VALUE))
  })
})
