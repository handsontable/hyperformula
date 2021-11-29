import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COLUMN', () => {
  it('should take one or zero arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(B1, B2)'],
      ['=COLUMN(B1, B2, B3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should take only reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(42)'],
      ['=COLUMN("foo")'],
      ['=COLUMN(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(1/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return row of a reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(A2)'],
      ['=COLUMN(G7)'],
      ['=COLUMN($E5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(7)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
  })

  it('should work for itself', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(A1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should return row of a cell in which formula is', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=COLUMN()'],
      ['=COLUMN()'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })

  it('should return row of range start', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(C1:D1)'],
      ['=COLUMN(A1:B1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })

  it('should be dependent on sheet structure changes', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['=COLUMN(A1)']
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(1)

    engine.addColumns(0, [0, 1])

    expect(engine.getCellValue(adr('B2'))).toEqual(2)
  })

  it('should collect dependencies of inner function and return argument type error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SIN(1)'],
      ['=COLUMN(SUM(A1,A3))'],
      ['=SIN(1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should propagate error of inner function', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=1/0'],
      ['=COLUMN(SUM(A1, A3))'],
      ['=1/0']
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return #CYCLE! when cyclic reference occurs not directly in COLUMN', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN(SUM(A1))'],
      ['=COLUMN(A1+A2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})
