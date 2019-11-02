import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe('SUM', () => {
  it('SUM without args',  () => {
    const engine =  HyperFormula.buildFromArray([['=SUM()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('SUM with args',  () => {
    const engine =  HyperFormula.buildFromArray([['=SUM(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(4.14)
  })

  it('SUM with range args',  () => {
    const engine =  HyperFormula.buildFromArray([['1', '2', '5'],
      ['3', '4', '=SUM(A1:B2)']])
    expect(engine.getCellValue(adr('C2'))).toEqual(10)
  })

  it('SUM with using previously cached value',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['3', '=SUM(A1:A1)'],
      ['4', '=SUM(A1:A2)'],
    ])
    expect(engine.getCellValue(adr('B2'))).toEqual(7)
  })

  it('SUM with bool',  () => {
    const engine =  HyperFormula.buildFromArray([['=SUM(1,TRUE())']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('SUM with string',  () => {
    const engine =  HyperFormula.buildFromArray([['=SUM(1,"foo")']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('SUM and + of 1 with "foo"',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1', 'foo'],
      ['=A1+B1', '=SUM(A1:B1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
  })

  it('SUM range with string values',  () => {
    const engine =  HyperFormula.buildFromArray([['1'], ['2'], ['foo'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('SUM range with bool values',  () => {
    const engine =  HyperFormula.buildFromArray([['1'], ['2'], ['=TRUE()'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('doesnt take value from range if it does not store cached value for that function',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=MAX(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('range only with empty value', () => {
    const engine = HyperFormula.buildFromArray([['', '=SUM(A1:A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('range only with some empty values', () => {
    const engine = HyperFormula.buildFromArray([['42', '', '13', '=SUM(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(55)
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=SUM(MMULT(A1:B2, A1:B2))']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(54)
  })
})
