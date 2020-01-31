import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('function BITOR', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(101)'],
      ['=BITOR(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for arguemnts of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(1, "foo")'],
      ['=BITOR("bar", 4)'],
      ['=BITOR("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should not work for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(1, -2)'],
      ['=BITOR(-1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should not work for non-integers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(1.2, 2)'],
      ['=BITOR(3.14, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(1, 5)'],
      ['=BITOR(457, 111)'],
      ['=BITOR(BIN2DEC(101), BIN2DEC(1))'],
      ['=BITOR(256, 123)'],
      ['=BITOR(0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5)
    expect(engine.getCellValue(adr('A2'))).toEqual(495)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(379)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
  })

  it('should return numeric type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITOR(1, 5)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })
})
