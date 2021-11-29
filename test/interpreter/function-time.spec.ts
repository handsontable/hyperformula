import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {Config} from '../../src/Config'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, timeNumberToString} from '../testUtils'

describe('Function TIME', () => {
  it('with 3 numerical arguments', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(0, 0, 0)', '=TIME(21, 0, 54)', '=TIME(3, 10, 24)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(timeNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('00:00:00')
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValue(adr('B1'))).toEqual(0.875625)
    expect(timeNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('21:00:54')
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.132222222222222)
    expect(timeNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('03:10:24')
  })

  it('truncation', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(0.9, 0, 0)', '=TIME(21, 0.5, 54)', '=TIME(3, 10, 24.99)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(timeNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('00:00:00')
    expect(engine.getCellValue(adr('B1'))).toEqual(0.875625)
    expect(timeNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('21:00:54')
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.132222222222222)
    expect(timeNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('03:10:24')
  })

  it('rollover', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(24, 0, 0)', '=TIME(19, 120, 54)', '=TIME(0, 189, 84)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(timeNumberToString(engine.getCellValue(adr('A1')), config)).toEqual('00:00:00')
    expect(engine.getCellValue(adr('B1'))).toEqual(0.875625)
    expect(timeNumberToString(engine.getCellValue(adr('B1')), config)).toEqual('21:00:54')
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.132222222222222)
    expect(timeNumberToString(engine.getCellValue(adr('C1')), config)).toEqual('03:10:24')
  })

  it('negative', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(-1, 59, 0)', '=TIME(0, -1, 59)', '=TIME(0, 1, -61)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NegativeTime))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NegativeTime))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NegativeTime))
  })

  it('fractions', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(0, 0.9, 0)', '=TIME(0, 0, -0.9)', '=TIME(0.9, 0, 0)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('number of arguments', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(0, 1)'],
      ['=TIME(0, 1, 1, 1)'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with incoercible argument', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME("foo", 1, 1)'],
      ['=TIME(0, "foo", 1)'],
      ['=TIME(0, 1, "foo")'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('with coercible argument', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['="0"', '=TRUE()'],
      ['=TIME(A1, 1, 1)'],
      ['=TIME(0, B1, 1)'],
      ['=TIME(0, 1, B1)'],
    ], config)
    expect(timeNumberToString(engine.getCellValue(adr('A2')), config)).toEqual('00:01:01')
    expect(timeNumberToString(engine.getCellValue(adr('A3')), config)).toEqual('00:01:01')
    expect(timeNumberToString(engine.getCellValue(adr('A4')), config)).toEqual('00:01:01')
  })

  it('precedence of errors', () => {
    const config = new Config()
    const [engine] = HyperFormula.buildFromArray([
      ['=TIME(FOOBAR(), 4/0, 1)'],
      ['=TIME(0, FOOBAR(), 4/0)'],
      ['=TIME(0, 1, FOOBAR())'],
    ], config)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })
})

