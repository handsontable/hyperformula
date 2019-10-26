import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('MIN', () => {
  it('MIN with empty args', () => {
    const engine = HyperFormula.buildFromArray([['=MIN()']])
    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('MIN with args', () => {
    const engine = HyperFormula.buildFromArray([['=MIN(1, B1)', '3.14']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('MIN with range', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with mixed arguments', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MIN(4,A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with string', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MIN(A1:A3,"foo")']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with string in range', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['foo'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN of strings', () => {
    const engine = HyperFormula.buildFromArray([['foo'], ['bar'], ['=MIN(A1:A2)']])
    expect(engine.getCellValue('A3')).toEqual(0)
  })

  it('MIN of strings and number', () => {
    const engine = HyperFormula.buildFromArray([['foo'], ['bar'], ['5'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('MIN of empty value', () => {
    const engine = HyperFormula.buildFromArray([['', '=MIN(A1)']])
    expect(engine.getCellValue('B1')).toEqual(0)
  })

  it('MIN of empty value and some negative number', () => {
    const engine = HyperFormula.buildFromArray([['', '1', '=MIN(A1,B1)']])
    expect(engine.getCellValue('C1')).toEqual(1)
  })
})
