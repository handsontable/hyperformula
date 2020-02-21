import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function CODE', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CODE()'],
      ['=CODE("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for empty strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CODE("")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should work for single chars', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CODE("")'],
      ['=CODE("!")'],
      ['=CODE("A")'],
      ['=CODE("Z")'],
      ['=CODE("Ñ")'],
      ['=CODE("ÿ")'],
      ['=CODE(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(33)
    expect(engine.getCellValue(adr('A3'))).toEqual(65)
    expect(engine.getCellValue(adr('A4'))).toEqual(90)
    expect(engine.getCellValue(adr('A5'))).toEqual(209)
    expect(engine.getCellValue(adr('A6'))).toEqual(255)
    expect(engine.getCellValue(adr('A7'))).toEqual(84)
  })

  it('should return code of first character', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CODE("Abar")'],
      ['=CODE("Ñbaz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(65)
    expect(engine.getCellValue(adr('A2'))).toEqual(209)
  })


  it('should return number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CODE("foo")']
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })
})
