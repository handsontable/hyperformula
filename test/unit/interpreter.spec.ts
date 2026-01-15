import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from './testUtils'

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

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('string literals - faulty tests', () => {
    const engine = HyperFormula.buildFromArray([
      ['www', '1www', 'www1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('www')
    expect(engine.getCellValue(adr('B1'))).toBe('1www')
    expect(engine.getCellValue(adr('C1'))).toBe('www1')
  })

  it('string literals in formula - faulty tests', () => {
    const engine = HyperFormula.buildFromArray([
      ['="www"', '="1www"', '="www1"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('www')
    expect(engine.getCellValue(adr('B1'))).toBe('1www')
    expect(engine.getCellValue(adr('C1'))).toBe('www1')
  })

  it('ranges - VALUE error when evaluating without context', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['2'], ['=A1:A2']])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('procedures - SUM with bad args', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('procedures - not known procedure', () => {
    const engine = HyperFormula.buildFromArray([['=FOO()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOO')))
  })

  it('errors - parsing errors', () => {
    const engine = HyperFormula.buildFromArray([['=1A1', '=foo(', '=)(asdf']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('function OFFSET basic use', () => {
    const engine = HyperFormula.buildFromArray([['5', '=OFFSET(B1, 0, -1)', '=OFFSET(A1, 0, 0)']])

    expect(engine.getCellValue(adr('B1'))).toBe(5)
    expect(engine.getCellValue(adr('C1'))).toBe(5)
  })

  it('function OFFSET out of range', () => {
    const engine = HyperFormula.buildFromArray([['=OFFSET(A1, -1, 0)', '=OFFSET(A1, 0, -1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.OutOfSheet))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.OutOfSheet))
  })

  it('function OFFSET returns bigger range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(OFFSET(A1, 0, 1,2,1))', '5', '6'],
      ['2', '3', '4'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(8)
  })

  it('function OFFSET returns rectangular range and fails', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OFFSET(A1, 0, 1,2,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('function OFFSET used twice in a range', () => {
    const engine = HyperFormula.buildFromArray([
      ['5', '6', '=SUM(OFFSET(A2,-1,0):OFFSET(A2,0,1))'],
      ['2', '3', '4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(16)
  })

  it('function OFFSET as a reference inside SUM', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '0', '10'],
      ['5', '6', '=SUM(SUM(OFFSET(C2,-1,0),A2),-B2)'],
    ])

    expect(engine.getCellValue(adr('C2'))).toBe(9)
  })

  it('initializing engine with multiple sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:Sheet1!B2)'],
      ],
    })

    expect(engine.getCellValue(adr('A1', 1))).toBe(6)
  })

  it('using bad range reference', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:Sheet2!A2)'],
        [''],
      ],
    })

    expect(engine.getCellValue(adr('A1', 1))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
  })

  it('expression with parenthesis', () => {
    const engine = HyperFormula.buildFromArray([
      ['=(1+2)*3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(9)
  })

  it('should return #REF when range is pointing to multiple sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['=SUM(Sheet1!A2:Sheet2!B3)'],
        ['=SUM(Sheet1!A:Sheet2!B)'],
        ['=SUM(Sheet1!2:Sheet2!3)'],
        ['=Sheet1!A2:Sheet2!B3'],
        ['=Sheet1!A:Sheet2!B'],
        ['=Sheet1!2:Sheet2!3'],
      ],
      'Sheet2': []
    })

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.RangeManySheets))
  })

  it('should return #REF when referencing non-existing sheet - just cell reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NonExistingSheet!A1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - cell reference inside a formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ABS(NonExistingSheet!A1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - cell reference inside a numeric aggregation formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!A1, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - cell range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!C4:F16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - cell range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!C4:F16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!1:2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - row range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!1:2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!A:B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when referencing non-existing sheet - column range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!A:B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - cell range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!A1:Sheet1!B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - cell range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!A1:Sheet1!B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - cell range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(Sheet1!A1:NonExistingSheet!B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - cell range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(Sheet1!A1:NonExistingSheet!B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!1:Sheet1!2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - row range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!1:Sheet1!2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(Sheet1!1:NonExistingSheet!2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - row range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(Sheet1!1:NonExistingSheet!2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(NonExistingSheet!A:Sheet1!B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range starts with non-existing sheet - column range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(NonExistingSheet!A:Sheet1!B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(Sheet1!A:NonExistingSheet!B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return #REF when range ends with non-existing sheet - column range - numeric aggregation function', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(Sheet1!A:NonExistingSheet!B)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })
})
