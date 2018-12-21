import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'
import {dateNumberToString} from '../../src/Date'

describe('Interpreter', () => {
  it('function TEXT', () => {
    const engine = HandsOnEngine.buildFromArray([['2', '=TEXT(A1, "mm/dd/yyyy")', '=TEXT(A1, "MM/DD/YYYY")']])

    expect(engine.getCellValue('B1')).toEqual('01/01/1900')
    expect(engine.getCellValue('C1')).toEqual('01/01/1900')
  })
})

it('function DATE with 3 numerical arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=DATE(1900, 1, 1)', '=DATE(1900, 1, 2)', '=DATE(1915, 10, 24)']])

  expect(engine.getCellValue('A1')).toEqual(2)
  expect(dateNumberToString(engine.getCellValue('A1') as number)).toEqual('01/01/1900')
  expect(engine.getCellValue('B1')).toEqual(3)
  expect(dateNumberToString(engine.getCellValue('B1') as number)).toEqual('01/02/1900')
  expect(dateNumberToString(engine.getCellValue('C1') as number)).toEqual('10/24/1915')
})

it('function MONTH with numerical arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=MONTH(0)', '=MONTH(2)', '=MONTH(43465)']])

  expect(engine.getCellValue('A1')).toEqual(12)
  expect(engine.getCellValue('B1')).toEqual(1)
  expect(engine.getCellValue('C1')).toEqual(12)
})

it('function MONTH with string arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=MONTH("12/31/1899")', '=MONTH("01/01/1900")', '=MONTH("12/31/2018")']])

  expect(engine.getCellValue('A1')).toEqual(12)
  expect(engine.getCellValue('B1')).toEqual(1)
  expect(engine.getCellValue('C1')).toEqual(12)
})

it('function MONTH with wrong arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=MONTH("foo")', '=MONTH("30/12/2018")', '=MONTH(1, 2)', '=MONTH()']])

  expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.NA))
  expect(engine.getCellValue('D1')).toEqual(cellError(ErrorType.NA))
})

it('function YEAR with numerical arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=YEAR(0)', '=YEAR(2)', '=YEAR(43465)']])

  expect(engine.getCellValue('A1')).toEqual(1899)
  expect(engine.getCellValue('B1')).toEqual(1900)
  expect(engine.getCellValue('C1')).toEqual(2018)
})

it('function YEAR with string arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=YEAR("12/31/1899")', '=YEAR("01/01/1900")', '=YEAR("12/31/2018")']])

  expect(engine.getCellValue('A1')).toEqual(1899)
  expect(engine.getCellValue('B1')).toEqual(1900)
  expect(engine.getCellValue('C1')).toEqual(2018)
})

it('function YEAR with wrong arguments', () => {
  const engine = HandsOnEngine.buildFromArray([['=YEAR("foo")', '=YEAR("30/12/2018")', '=YEAR(1, 2)', '=YEAR()']])

  expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.NA))
  expect(engine.getCellValue('D1')).toEqual(cellError(ErrorType.NA))
})
