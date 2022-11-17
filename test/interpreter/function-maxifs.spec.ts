import {HyperFormula, ErrorType} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectArrayWithSameContent} from '../testUtils'
import {DateTimeHelper} from '../../src/DateTimeHelper'
import {Config} from '../../src/Config'

describe('Function MAXIFS - argument validations and combinations', () => {
  it('requires odd number of arguments, but at least 3', () => {
    const engine = HyperFormula.buildFromArray([['=MAXIFS(C1, ">0")'], ['=MAXIFS(C1, ">0", B1, B1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('error when criterion unparsable', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MAXIFS(B1:B2, C1:C2, "><foo")'],
      ['=MAXIFS(B1:B2, C1:C2, "=1", C1:C2, "><foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadCriterion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadCriterion))
  })

  it('error when different width dimension of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MAXIFS(B1:C1, B2:D2, ">0")'],
      ['=MAXIFS(B1, B2:D2, ">0")'],
      ['=MAXIFS(B1:D1, B2, ">0")'],
      ['=MAXIFS(B1:D1, B2:D2, ">0", B2:E2, ">0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('error when different height dimension of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MAXIFS(B1:B2, C1:C3, ">0")'],
      ['=MAXIFS(B1, C1:C2, ">0")'],
      ['=MAXIFS(B1:B2, C1, ">0")'],
      ['=MAXIFS(B1:B2, C1:C2, ">0", C1:C3, ">0")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('scalars are treated like singular arrays', () => {
    const engine = HyperFormula.buildFromArray([['=MAXIFS(42, 10, ">1")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  it('should return 0 as max from an empty range', () => {
    const engine = HyperFormula.buildFromArray([['=MAXIFS(42, -1, ">1")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('error propagation', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MAXIFS(4/0, 42, ">1")'],
      ['=MAXIFS(0, 4/0, ">1")'],
      ['=MAXIFS(0, 42, 4/0)'],
      ['=MAXIFS(0, 4/0, FOOBAR())'],
      ['=MAXIFS(4/0, FOOBAR(), ">1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works when arguments are just references', () => {
    const engine = HyperFormula.buildFromArray([['2', '3'], ['=MAXIFS(B1, A1, ">1")']])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('works with numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['2', 'a'],
      ['3', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('works with percents', () => {
    const engine = HyperFormula.buildFromArray([
      ['2%', 'a'],
      ['3%', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(.03)
  })

  it('works with currencies', () => {
    const engine = HyperFormula.buildFromArray([
      ['$2', 'a'],
      ['$3', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('works with dates', () => {
    const dateHelper = new DateTimeHelper(new Config())

    const engine = HyperFormula.buildFromArray([
      ['20/01/2020', 'a'],
      ['30/01/2020', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(dateHelper.numberToSimpleDate(engine.getCellValue(adr('A3')) as number)).toEqual({ day: 30, month: 1, year: 2020 })
  })

  it('strings are ignored', () => {
    const engine = HyperFormula.buildFromArray([
      ['-1', 'a'],
      ['abc', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
  })

  it('empty cells are ignored', () => {
    const engine = HyperFormula.buildFromArray([
      ['-1', 'a'],
      ['', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
  })

  it('booleans are ignored', () => {
    const engine = HyperFormula.buildFromArray([
      ['-1', 'a'],
      ['=TRUE()', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
  })

  it('max of empty cells is zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['', 'a'],
      ['', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('max of strings is zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['abc', 'a'],
      ['cba', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('max of booleans is zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUE()', 'a'],
      ['=FALSE()', 'a'],
      ['=MAXIFS(A1:A2, B1:B2, "a")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('works with range values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1', '3', '5'],
      ['1', '1', '7', '9'],
      ['=MAXIFS(MMULT(C1:D2, C1:D2), MMULT(A1:B2, A1:B2), "=2")'],
      ['=MAXIFS(MMULT(C1:D2, C1:D2), A1:B2, "=1")'],
      ['=MAXIFS(C1:D2, MMULT(A1:B2, A1:B2), "=2")'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(116)
    expect(engine.getCellValue(adr('A4'))).toEqual(116)
    expect(engine.getCellValue(adr('A5'))).toEqual(9)
  })

  it('works for mixed reference/range arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['2', '3'],
      ['=MAXIFS(B1, A1:A1, ">1")'],
      ['4', '5'],
      ['=MAXIFS(B3:B3, A3, ">1")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('works when criterion arg is an inline array', () => {
    const engine = HyperFormula.buildFromArray([[2, 'a'], [3, 'b'], ['=MAXIFS(A1:A2, B1:B2, {"a", "b"})']], {
      useArrayArithmetic: true,
    })

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('B3'))).toEqual(3)
  })
})

describe('Function MAXIFS - calcultions on more than one criteria', () => {
  it('works for more than one criterion/range pair', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '100', '3'],
      ['1', '101', '5'],
      ['2', '102', '7'],
      ['=MAXIFS(C1:C3, A1:A3, ">=1", B1:B3, "<102")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })
})

describe('Function MAXIFS - cache recalculation after cruds', () => {
  it('recalculates MAXIFS if changes in the first range', () => {
    const sheet = [['10', '10'], ['5', '6'], ['7', '8'], ['=MAXIFS(A1:B1, A2:B2, ">=5", A3:B3, ">=7")']]
    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), [['1', '3']])
    const newValues = changes.map(c => c.newValue)

    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expectArrayWithSameContent(newValues, [1, 3, 3])
  })

  it('recalculates MAXIFS if changes in one of the tested range', () => {
    const sheet = [['20', '10'], ['5', '6'], ['7', '8'], ['=MAXIFS(A1:B1, A2:B2, ">=5", A3:B3, ">=7")']]
    const engine = HyperFormula.buildFromArray(sheet)
    expect(engine.getCellValue(adr('A4'))).toEqual(20)

    engine.setCellContents(adr('A3'), [['1', '7']])

    expect(engine.getCellValue(adr('A4'))).toEqual(10)
  })
})
