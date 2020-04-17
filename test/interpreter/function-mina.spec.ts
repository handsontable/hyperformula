import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('MINA', () => {
  it('MINA with empty args', () => {
    const engine = HyperFormula.buildFromArray([['=MINA()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('MINA with args', () => {
    const engine = HyperFormula.buildFromArray([['=MINA(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('MINA with range', () => {
    const engine = HyperFormula.buildFromArray([['1'], ['3'], ['2'], ['=MINA(A1:A3)']])

    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('does only boolean coercions',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="42"', '=MINA(A1)'],
      ['=TRUE()', '=MINA(A2)'],
      ['=FALSE()', '=MINA(A3)'],
      ['="TRUE"', '=MINA(A4)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('B4'))).toEqual(0)
  })

  it('MINA of empty value', () => {
    const engine = HyperFormula.buildFromArray([['', '=MINA(A1)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('MINA of empty value and some positive number', () => {
    const engine = HyperFormula.buildFromArray([['', '1', '=MINA(A1,B1)']])

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=MINA(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(7)
  })

  it('propagates errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=MINA(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
